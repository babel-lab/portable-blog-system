# 2026-05-26 Natural Reverse UTM Fixture Topic Plan

Phase: `20260526-pm-26-natural-reverse-utm-fixture-topic-planning-docs-only-a`
Date: 2026-05-26
Type: WRITE PHASE / docs-only / topic planning
Sole deliverable: 本檔（`docs/20260526-natural-reverse-utm-fixture-topic-plan.md`）

---

## 1. Purpose

本文件**只**規劃「未來自然產生 positive GitHub cross-link fixture 的內容題目方向」，使 reverse UTM 之 pm-26 deploy gate 在**未來**有機會被自然解除。

本文件**不是**：

- 不是 deploy 啟動指令
- 不是 Blogger repost 啟動指令
- 不是 GA4 validation 啟動指令
- 不是 content creation 啟動指令（不建立任何實際文章）
- 不是 fixture 建立指令（不修改任何 `content/` 檔案）
- 不是新 spec、不取代既有 reverse UTM canonical 文件

本文件性質：**docs-only / topic-only planning**；落地後 production state drift = 0；屬 reverse UTM dormant 期間之**內容題目候選預備**。

對應上層（read-only reference）：

- `CLAUDE.md` §16.4（reverse UTM 規格主錨；source landed but dormant）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 readiness addendum；主軌 / 副軌 A / 副軌 B）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（pm-26 啟動條件 §D.1-3）
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`（5/26 fixture scan；結論 0/5 usable）
- `docs/phase-2-candidate-roadmap.md` §1.7 / §3.3（自然 fixture 內容規劃；passive wait）
- `docs/20260526-end-of-day-report.md` §6（reverse UTM / pm-26 gate snapshot）

---

## 2. Current Gate Status

紀錄當前（2026-05-26 EOD 之後）reverse UTM 與 pm-26 deploy gate 狀態：

| 項目 | 值 |
|---|---|
| reverse UTM source landed | ✅ pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`（2026-05-23）|
| reverse UTM live 狀態 | 🟡 **landed but dormant** |
| Blogger 後台重貼 | ❌ 尚未 |
| GA4 reverse UTM validation | ❌ 尚未 |
| pm-26 deploy gate | 🔴 **BLOCKED** |
| blocked reason | **no positive GitHub cross-link fixture**（無任一 ready Blogger full-mode post 之 `relatedLinks` / `otherLinks` 含 hostname == `babel-lab.github.io` 之 URL）|
| 既有 candidates 之可用性 | 0 / 5（per `docs/20260526-reverse-utm-positive-fixture-scan-report.md` §4.3）|

本檔**不**解除上述 gate；屬 dormant 期間之**內容題目候選預備**，等待未來自然觸發。

---

## 3. What Counts as a Positive Fixture

「positive fixture」之**充要條件**（per `docs/reverse-utm-fixture-plan.md` §3 / `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §D.1）：

1. ✅ **自然出現**：Blogger 文章中**自然出現** GitHub Pages article link（hostname == `settings.site.githubSiteUrl` 之 host，即 `babel-lab.github.io`）
2. ✅ **非硬塞**：link **不是**硬塞測試資料、不是 lorem ipsum、不是「為驗收而寫之假測試文」
3. ✅ **可觸發 helper 驗證**：link 可支援 reverse UTM helper（`applyCrossSiteUtm({ direction: 'to_github' })`）驗證 → 即 frontmatter 含 `publishTargets.blogger.enabled: true` + `publishTargets.blogger.mode: 'full'` + `status: ready` + `draft: false` + `relatedLinks` 或 `otherLinks` 至少 1 筆 GitHub Pages cross-link
4. ✅ **內容語意合理**：Blogger 文章主題與 GitHub Pages 目標文章之語意連結合理（讀者觀感自然；不破壞「書評末尾只導 Blogger 同主題前作」既有策略 invariant）
5. ✅ **辨識清楚**：可在 Blogger repost / GA4 validation 前被清楚辨識（slug 明確；fixture 性質可在 `.publish.json` / docs trail 中追蹤）

額外**驗收後處理 invariant**（per `docs/reverse-utm-fixture-plan.md` §7）：

- 若驗收完成，**保留為正式發布文章**為佳；fixture 不應「驗收後刪改」
- 若評估發現主題不適合公開，應**驗收階段就不執行 Blogger 後台重貼**，改採靜態驗收（本機 build:blogger + grep dist-blogger/ post.html）

---

## 4. Candidate Natural Content Topics

以下提出 **7 個候選**內容題目，方向涵蓋 user 列出之 6 個方向（Blogger 系統建置紀錄 / 自媒體內容工具 / GitHub Pages 與 Blogger 雙平台文章 / 書評筆記教學 / 下載型資源頁 / GA4 / UTM 追蹤教學）。

每個候選包含 6 個欄位：title / why natural / possible Blogger article / possible GitHub Pages target / fixture usefulness / risk level。

**注意**：以下皆為**題目候選**；本檔**不**建立任何實際文章；任何 fixture 建立行為須另開 phase 並走 `docs/reverse-utm-fixture-plan.md` §10.5 Phase 1-6 流程。

---

### T1. 「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」

| 欄位 | 內容 |
|---|---|
| **Title** | 我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容 |
| **Direction** | Blogger 系統建置紀錄 |
| **Why it is natural** | 文章主題本身就是「介紹這套系統」，自然會引用 GitHub Pages 上之系統開發筆記（`portable-blog-system-mvp`）作為延伸閱讀。讀者讀完心得文若想了解技術細節，自然會點進 GitHub 站。對應 `docs/reverse-utm-fixture-plan.md` §4.2 副軌 A 第 1 個提案題目。 |
| **Possible Blogger article** | Blogger full-mode 經營心得文章；slug 範例 `portable-blog-system-introduction`；`contentKind: post`（生活/經營心得）；`relatedLinks` 自然包含 1-2 筆 GitHub Pages cross-link |
| **Possible GitHub Pages target** | `portable-blog-system-mvp`（主要）；`github-pages-blog-planning`（次要；若文章談 GitHub Pages 免費空間策略可一併引用）|
| **Fixture usefulness** | ⭐⭐⭐⭐⭐ 最高。一篇即可同時觸發 `utm_content=related_links`（若放 `relatedLinks`）+ 潛在 `utm_content=other_links`（若同時放 `otherLinks`）兩條注入路徑。主題自然性最高（系統介紹文 → 系統開發筆記）。 |
| **Risk level** | 🟢 低。屬全新文章；不覆蓋既有 published 文章；不影響既有 SEO fixture（不重用 `portable-blog-system-mvp` 之 fixture 鎖定）；主題自然性高。 |

---

### T2. 「Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡」

| 欄位 | 內容 |
|---|---|
| **Title** | Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡 |
| **Direction** | GitHub Pages 與 Blogger 雙平台文章 |
| **Why it is natural** | 主題本身就是「比較兩平台」，引用 GitHub Pages 上之「免費空間限制與部落格規劃」文章（`github-pages-blog-planning`）作為延伸閱讀符合讀者預期。對應 `docs/reverse-utm-fixture-plan.md` §4.2 副軌 A 第 2 個提案題目。 |
| **Possible Blogger article** | Blogger full-mode 平台策略心得文章；slug 範例 `blogger-vs-github-pages-strategy`；`contentKind: post`；`relatedLinks` 含 GitHub Pages 規劃文 cross-link |
| **Possible GitHub Pages target** | `github-pages-blog-planning`（主要）；可選 `portable-blog-system-mvp` 作為次引（談「為什麼還做了一套系統」）|
| **Fixture usefulness** | ⭐⭐⭐⭐ 高。主題與 GitHub 目標文章高度對齊；雙引時可同時觸發兩 `utm_content` value。 |
| **Risk level** | 🟢 低。屬全新文章；不影響既有發布；雙平台比較類心得屬作者自然會寫之主題。 |

---

### T3. 「為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結」

| 欄位 | 內容 |
|---|---|
| **Title** | 為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結 |
| **Direction** | Blogger 系統建置紀錄 / 自媒體內容工具 |
| **Why it is natural** | 文章本身就是 meta-explanation：解釋作者為何開始 cross-link。引用 GitHub Pages 上之系統開發筆記說明「另一站在做什麼」最符合讀者期待。對應 `docs/reverse-utm-fixture-plan.md` §4.2 副軌 A 第 3 個提案題目。 |
| **Possible Blogger article** | Blogger full-mode 經營心得短文；slug 範例 `why-i-add-github-related-links`；`contentKind: post`；長度可較短（800-1500 字）；`relatedLinks` 含 GitHub Pages cross-link |
| **Possible GitHub Pages target** | `portable-blog-system-mvp`（介紹這套支援 cross-link 自動 UTM 處理的系統）；可選 `github-pages-blog-planning` |
| **Fixture usefulness** | ⭐⭐⭐⭐ 高。主題天然 self-referential；cross-link 出現於 `relatedLinks` 屬「為何加」之最自然示範。 |
| **Risk level** | 🟢 低。短文可較快撰寫；不覆蓋既有 published；主題與 fixture 行為高度自洽（meta 文章本身就在示範被驗收之 feature）。 |

---

### T4. 「《AI 玩轉自媒體》讀後實作筆記：把書摘搬到 Blogger + GitHub Pages 雙站」

| 欄位 | 內容 |
|---|---|
| **Title** | 《AI 玩轉自媒體的 52 個商業思維》讀後實作筆記：把書摘搬到 Blogger + GitHub Pages 雙站 |
| **Direction** | 書評 / 筆記 + 自媒體內容工具 |
| **Why it is natural** | 書評（讀後實作筆記類）+ 自然帶到「我自己怎麼做自媒體分發」，引用 GitHub Pages 上之雙站系統筆記合理。**注意**：與既有 `we-media-myself2`（書摘漫畫 + 提問筆記）屬**同書不同切角**之**另寫一篇**，不覆蓋既有 published。對應 `docs/reverse-utm-fixture-plan.md` §3.2 之 use case：「書評提到 AI 自媒體工具 / 個人品牌經營自然連到 GitHub 站技術 / 心得文章」。 |
| **Possible Blogger article** | Blogger full-mode 書評類「實作筆記」文章；slug 範例 `ai-media-book-implementation-notes`；`contentKind: book-review`；`relatedLinks` 含 GitHub Pages cross-link 描述「實作工具」|
| **Possible GitHub Pages target** | `portable-blog-system-mvp`（主要；對應「我用什麼工具」）；`github-pages-blog-planning`（次要；對應「為何選 GitHub Pages」）|
| **Fixture usefulness** | ⭐⭐⭐ 中高。書評類本身為作者熟悉之長期主題；cross-link 屬「實作工具」自然延伸；fixture 性質清晰。 |
| **Risk level** | 🟡 中。屬全新文章不覆蓋既有；但需確保**不破壞既有「書評末尾只導 Blogger 同主題前作」策略 invariant**（per `docs/reverse-utm-fixture-plan.md` §2.1）→ 此題目應定位為「讀後**實作**筆記」而非純書評，明確區隔讀者期待。 |

---

### T5. 「Blogger 部落格 + GitHub Pages 技術筆記：個人品牌兩條腿的差異化」

| 欄位 | 內容 |
|---|---|
| **Title** | Blogger 部落格 + GitHub Pages 技術筆記：個人品牌兩條腿的差異化 |
| **Direction** | 自媒體內容工具 + GitHub Pages 與 Blogger 雙平台文章 |
| **Why it is natural** | 主題談「個人品牌經營」之雙平台差異化策略，自然會引用 GitHub Pages 站之技術 / 心得文章作為「另一條腿在寫什麼」之具體範例。 |
| **Possible Blogger article** | Blogger full-mode 經營心得文章；slug 範例 `personal-brand-two-platforms-differentiation`；`contentKind: post`；`relatedLinks` 含 GitHub Pages cross-link |
| **Possible GitHub Pages target** | `github-pages-blog-planning`（主要；對應「另一站之定位策略」）；可選 `portable-blog-system-mvp`（對應「兩站如何串接」）|
| **Fixture usefulness** | ⭐⭐⭐ 中。經營心得類；cross-link 自然但題目較廣，需確保具體寫到雙站案例才能自然帶連結。 |
| **Risk level** | 🟢 低。屬全新文章；不影響既有發布；屬作者熟悉之經營心得題材。 |

---

### T6. 「我用 GA4 追蹤 Blogger 流量導到 GitHub 站的方法（UTM 設定筆記）」

| 欄位 | 內容 |
|---|---|
| **Title** | 我用 GA4 追蹤 Blogger 流量導到 GitHub 站的方法（UTM 設定筆記） |
| **Direction** | GA4 / UTM 追蹤教學 |
| **Why it is natural** | 文章主題本身就是「我怎麼追蹤兩站之間的流量」，必然要附上 GitHub Pages 站之具體文章 URL 作為「導去哪裡」之示例。**注意**：此題之 fixture 性質非常自然（cross-link 是教學主題本身），但需小心**不**過度暴露內部 UTM 規格細節（per `CLAUDE.md` §16.4 為內部規格；對讀者可只說「有自動加 UTM」而不揭露完整 4-key scheme）。|
| **Possible Blogger article** | Blogger full-mode 工具教學文章；slug 範例 `ga4-cross-site-utm-tracking-notes`；`contentKind: tech-note` 或 `post`；`relatedLinks` / `otherLinks` 含 GitHub Pages cross-link |
| **Possible GitHub Pages target** | `github-pages-blog-planning`（主要）；`portable-blog-system-mvp`（次要；對應「我用什麼工具做自動 UTM」）|
| **Fixture usefulness** | ⭐⭐⭐⭐ 高。cross-link 是教學主題本身；fixture 性質最自洽（文章在教 UTM 追蹤，文章內就會出現被追蹤的 UTM cross-link）。 |
| **Risk level** | 🟡 中。需注意 meta-paradox（文章談 UTM 同時自己也被注入 UTM）；GA4 validation 後 GA4 中之該文 event 可能引發解讀困難；建議撰寫時明確區分「教學 example URL」與「實際 reverse UTM」。 |

---

### T7. 「免費教具 PDF 下載 + 製作工具分享：為什麼把製作筆記放在 GitHub Pages」

| 欄位 | 內容 |
|---|---|
| **Title** | 免費教具 PDF 下載 + 製作工具分享：為什麼把製作筆記放在 GitHub Pages |
| **Direction** | 下載型資源頁 + 自媒體內容工具 |
| **Why it is natural** | 教具下載文章自然帶到「製作方法 / 工具」之延伸，引用 GitHub Pages 上之系統 / 製作筆記合理。對應 `docs/reverse-utm-fixture-plan.md` §4.3 副軌 B：「若教具下載文章自然提到網站製作 / 教學素材發布平台，可連 GitHub 技術文章」。 |
| **Possible Blogger article** | Blogger full-mode 教具下載文章；slug 範例 `teaching-material-download-with-tools-notes`；`contentKind: download`；含 `download.enabled: true` + `download.fileUrl`；`relatedLinks` 含 GitHub Pages cross-link |
| **Possible GitHub Pages target** | `portable-blog-system-mvp`（主要；對應「製作工具 / 系統」）|
| **Fixture usefulness** | ⭐⭐ 中。題目契合度視具體文章而定；cross-link 屬「附帶延伸」而非主軸；fixture 性質弱於 T1-T3 之系統建置紀錄類。 |
| **Risk level** | 🟢 低。屬全新教具文章；不影響既有；download fixture 不破壞 SEO 既有 fixture 鎖定（`portable-blog-system-mvp` 之 SEO fixture 為另一維度）。 |

---

## 5. Recommended First Fixture Candidate

**推薦：T1 「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」**

### 5.1 理由

| 維度 | T1 優勢 |
|---|---|
| **主題自然性** | ⭐⭐⭐⭐⭐ 最高。文章主題就是「介紹這套系統」→ 引用 GitHub Pages 上之系統開發筆記（`portable-blog-system-mvp`）是讀者**預期**之延伸閱讀，不是硬塞。對應 `docs/reverse-utm-fixture-plan.md` §4.2 副軌 A 第 1 個官方提案題目。|
| **fixture 觸發路徑** | 可同時觸發 `utm_content=related_links`（放 `relatedLinks`）+ `utm_content=other_links`（放 `otherLinks`）兩條注入路徑 → 一篇即覆蓋雙 UTM content value 之驗收。|
| **invariant 不破壞** | 不覆蓋既有 published 文章（不是改 `we-media-myself2`）；不影響既有 SEO fixture（不是改 `portable-blog-system-mvp` 之 mode）；不破壞「書評末尾只導 Blogger 同主題前作」策略。|
| **production 價值** | 本身就是一篇「介紹本系統」之 production 文章；驗收完成後保留發布合理（per `docs/reverse-utm-fixture-plan.md` §7.1）。|
| **撰寫成本** | 中等。作者熟悉系統內部細節 → 寫起來不需大量研究；可控長度（1500-3000 字即可）。|
| **GA4 validation 解讀清晰** | 驗收時 GA4 出現 `source=blogger` event 之來源文章與目標文章一目了然，不會與其他 UTM 混淆（不像 T6 之 meta-paradox 風險）。|
| **fixture trail 追蹤** | slug 與題目語意一致；未來 cold-start session / docs trail 提及 fixture 時辨識清楚。|

### 5.2 為何不選其他

- **T2 / T3**：自然性與 T1 接近，但 T1 同時兼具「介紹系統」之 production 價值（非純 meta），可直接成為對讀者有用之長期內容。
- **T4**：屬書評類，需小心不破壞「書評末尾只導 Blogger 同主題前作」既有策略 invariant；風險略高（🟡）；非首選。
- **T5**：題目較廣，需具體寫到雙站案例才能自然帶連結；不如 T1 / T3 之自洽性高。
- **T6**：cross-link 是教學主題本身，但有 meta-paradox 風險（文章談 UTM 同時自己被注入 UTM）+ GA4 validation 解讀風險；非首選。
- **T7**：下載類；cross-link 屬「附帶延伸」而非主軸；fixture 性質較弱。

### 5.3 推薦邊界

⛔ **本節只是推薦；本檔不建立 T1 文章**。

未來若 user 決定主動建立 T1 之實際文章作為 fixture，須：

1. 另開新 phase（per `docs/reverse-utm-fixture-plan.md` §10.5 Phase 1）
2. 依 §3 之 5 條充要條件完整滿足
3. 走 §10.5 Phase 1-6 完整流程
4. 不可在本 phase 之延伸對話中順手實作

---

## 6. Explicit Non-Actions

本 phase（`20260526-pm-26-natural-reverse-utm-fixture-topic-planning-docs-only-a`）**明確未做**：

- ❌ **no source change**：未修改 `src/` / `src/scripts/` / `src/views/` 任一檔案
- ❌ **no settings change**：未修改 `content/settings/` 任一檔案
- ❌ **no content post creation**：未新增任何 `content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` 之 `.md` / `.publish.json` / `.fb.md`
- ❌ **no content post modification**：未修改任何既有 ready / draft / published post
- ❌ **no template change**：未修改 `content/templates/` 任一檔案
- ❌ **no build**：未執行 `npm run build*` / `validate:content` / `report:*` / `check:*` / `smoke:*` 任一指令
- ❌ **no deploy**：未切換 gh-pages branch；未碰 deploy repo
- ❌ **no Blogger repost**：未操作 Blogger 後台；未重貼任何 post.html 或 theme CSS
- ❌ **no GA4 validation**：未操作 GA4 後台；未做 Realtime / DebugView 觀察
- ❌ **no fixture creation**：未建立任何實際 fixture 文章；本檔只列**題目候選**
- ❌ **no npm install**：未動 `package.json` / `package-lock.json`
- ❌ **no README change**：未修改根 `README.md`
- ❌ **no README §7 refresh**：不追補本 phase commit 至 README §7（避免 self-referential refresh loop）
- ❌ **no docs/README change**：未修改 `docs/README.md`
- ❌ **no EOD report change**：未修改 `docs/20260526-end-of-day-report.md`
- ❌ **no phase-1 guide change**：未修改 `docs/phase-1-user-operation-guide.md`
- ❌ **no phase-2 roadmap change**：未修改 `docs/phase-2-candidate-roadmap.md`
- ❌ **no PROJECT_TREE refresh**：未修改 `PROJECT_TREE.txt`
- ❌ **no amend / no force-push**：不 amend 既有 commit；不 force-push
- ❌ **no reverse UTM dormant 狀態解除**：reverse UTM 維持 landed but dormant
- ❌ **no pm-26 deploy gate 解除**：pm-26 deploy gate 維持 BLOCKED

本檔落地後 production state drift = 0。

---

## 7. Future Execution Notes

未來若要**真正解除** pm-26 deploy gate，**不可**在本 phase 或本 phase 延伸對話內直接執行。**必須另開新 phase**，並依以下順序進行：

### 7.1 必要前置條件（per `docs/reverse-utm-fixture-plan.md` §6）

啟動 deploy gate 解除前，須**全部**成立：

1. ✅ 已存在至少 1 篇符合 §3 充要條件之 fixture post（從 §4 候選中選定，或等自然書評 / 心得文章自然引用）
2. ✅ fixture post 之 frontmatter 已通過 `npm run validate:content`，0 warning
3. ✅ `npm run build:blogger` 成功 + `docs/reverse-utm-fixture-plan.md` §5.1.1-5.1.4 全部 invariant 驗證通過
4. ✅ user 已**明確同意**手動重貼 Blogger 後台
5. ✅ 若 fixture post 為新建非已發布文章，已決定驗收後是否保留為正式發布文章
6. ✅ GA4 Realtime / Acquisition 已準備就緒

### 7.2 建議 phase 拆分（per `docs/reverse-utm-fixture-plan.md` §10.5）

依**最小可驗證單位**拆 6 個 phase：

| Phase | 動作 | 需要 |
|---|---|---|
| **Phase 1** | 建立 fixture content：新增 `content/blogger/posts/{date}-{slug}.md` + `.publish.json`；frontmatter 含 `mode: full` + `relatedLinks` 含 GitHub cross-link；通過 `validate:content` 0 warning | **real content**（不可 lorem ipsum）|
| **Phase 2** | `npm run build:blogger` 驗 §5.1.1-5.1.4 全部 invariant | **build if needed** |
| **Phase 3** | git add content + commit + push origin/main | — |
| **Phase 4** | user 手動 Blogger 後台 per-post HTML 重貼；前置依 `docs/20260524-blogger-repost-checklist.md` §2.2 備份 + §3 重貼；後續回填 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` 至 `.publish.json`；等待 Blogger CDN cache 5-10 分鐘 | **Blogger repost if needed** |
| **Phase 5** | user 用 Chrome 無痕（或 GA Debug Mode）開啟 Blogger 重貼後文章 → 點擊 GitHub cross-link → GA4 Realtime / DebugView 觀察；依 `docs/20260524-ga4-reverse-utm-observation.md` §4.2 步驟 | **GA4 validation if needed** |
| **Phase 6** | 新增 `docs/YYYYMMDD-reverse-utm-fixture-verification-report.md`；含 fixture slug / 標題 / 發布日期 / post.html grep snippet / GA4 Realtime 紀錄 / forward UTM 共存驗證 / summary CTA UTM 區分驗證 / 驗收後處理決策 | **verify reverse UTM behavior** |

phase 間依賴：

```text
Phase 1 (content) → Phase 2 (build verify) → Phase 3 (commit + push)
                                                  │
                                                  ↓
Phase 4 (Blogger repost) → Phase 5 (GA4 observe) → Phase 6 (verification report)
```

### 7.3 主軌 vs 副軌建議（per `docs/reverse-utm-fixture-plan.md` §10.4）

🟢 **主軌（推薦）：等自然文章**

- 不主動建立 fixture；等下一篇自然書評 / 心得文章自然引用 GitHub 站
- 時程不可預測；屬最高 production-grade 真實性
- dormant 屬 expected default state，不是 tracking 壞掉

🟢 **副軌 A（user 自決時機）：依 §5 推薦之 T1 主動建立**

- 若 user 評估「想加快驗收節奏」，可選 T1 為起點
- 走 §7.2 完整 6 phase 流程
- 不勉強時機；本檔不催促

🔴 **不採用**：

- ❌ 硬改既有 ready / published 文章作為 fixture（per `docs/reverse-utm-fixture-plan.md` §2 / 本檔 §3 invariant）
- ❌ 為驗收而寫之假測試文
- ❌ 改 SCSS / source / build pipeline 來繞過 fixture 需求

---

## 8. Boundary Statement

| 項目 | 狀態 |
|---|---|
| docs-only | ✅ |
| 只新增唯一 doc 檔（`docs/20260526-natural-reverse-utm-fixture-topic-plan.md`）| ✅ |
| no README.md change | ✅ |
| no docs/README.md change | ✅ |
| no docs/20260526-end-of-day-report.md change | ✅ |
| no docs/phase-1-user-operation-guide.md change | ✅ |
| no docs/phase-2-candidate-roadmap.md change | ✅ |
| no PROJECT_TREE.txt change | ✅ |
| no content/templates/ change | ✅ |
| no src/ change | ✅ |
| no content/blogger/posts/ change | ✅ |
| no dist/ / dist-blogger/ / dist-promotion/ / dist-reports/ / gh-pages change | ✅ |
| no positive fixture creation | ✅ |
| no build | ✅ |
| no deploy | ✅ |
| no Blogger repost | ✅ |
| no GA4 validation | ✅ |
| no npm install | ✅ |
| no amend / no force-push | ✅ |
| no README §7 self-reference refresh | ✅ |
| reverse UTM remains landed but dormant | ✅ |
| pm-26 deploy gate remains BLOCKED | ✅ |

本檔落地後 production state drift = 0；屬純 docs-only topic planning entry。

---

## 9. Cross-links

### 9.1 reverse UTM canonical（規格與設計主錨）

- `CLAUDE.md` §16.4（reverse UTM 規格主錨；source landed but dormant）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 readiness addendum）

### 9.2 reverse UTM 5/25 ~ 5/26 docs trail

- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（pm-26 啟動條件）
- `docs/20260525-deploy-diff-dry-run-readonly-report.md`（deploy diff dry-run；fixture 缺席 root cause）
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`（5/26 fixture scan；0/5 結論）
- `docs/20260526-end-of-day-report.md` §6（5/26 EOD reverse UTM gate snapshot）

### 9.3 user 手動操作 SOP（未來 Phase 4-5 啟動才會用到）

- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM 觀察 SOP）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）

### 9.4 Phase 2 roadmap

- `docs/phase-2-candidate-roadmap.md` §1.7（自然 fixture 內容規劃；本檔對應條目）
- `docs/phase-2-candidate-roadmap.md` §3.3（Blogger → GitHub 反向 UTM；source landed dormant；pm-26 BLOCKED）

---

（本文件結束）
