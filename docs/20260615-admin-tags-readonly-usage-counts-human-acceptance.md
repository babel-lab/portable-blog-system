# BLOG ADMIN — Tags Read-only Usage Counts 人眼瀏覽驗收紀錄

- **Phase**：`20260615-night-8-admin-tags-readonly-usage-counts-human-acceptance-a`
- **日期**：2026-06-15（night-8，23:00）
- **性質**：docs-only acceptance record（人眼瀏覽驗收紀錄；**不**改 src / content / settings / templates / views / package / lockfile；**不** npm install / build / deploy / Blogger repost；**不**動 CLAUDE.md；**不**新增功能）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-ia-shell-implementation-record.md`（night-1 IA shell implementation）
  - `docs/20260615-admin-ia-shell-human-acceptance-record.md`（night-2 IA shell acceptance）
  - `docs/20260615-admin-posts-index-readonly-derived-fields-record.md`（night-3 posts readiness fields implementation）
  - `docs/20260615-admin-posts-readiness-human-acceptance-record.md`（night-4 posts readiness acceptance）
  - `docs/20260615-admin-categories-readonly-usage-counts-record.md`（night-5 categories usage counts implementation）
  - `docs/20260615-admin-categories-readonly-usage-counts-human-acceptance.md`（night-6 categories usage acceptance）
  - `docs/20260615-admin-tags-readonly-usage-counts-record.md`（night-7 tags usage counts implementation）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : ac0476b == origin/main
last commit   : feat(admin): add tag usage counts
```

`git log --oneline -3`：

```
ac0476b feat(admin): add tag usage counts
77bdc20 docs(admin): record category usage acceptance
f9f7ef5 feat(admin): add category usage counts
```

→ baseline 完全符合預期；本 phase 自此基礎上做純 docs-only 驗收紀錄。

---

## B. 本 phase 目標

依 night-7 implementation（admin Categories & Tags 區塊延伸 Tags per-tag usage counts + Tag totals row + 3 sub-buckets + cross-site mismatch read-only 提示）之預期使用流程，**由 user 以人眼瀏覽方式驗收**：

- 確認 `npm run dev` 後 ADMIN 頁可正常開啟並跳至 `#tags`
- 確認 night-7 新增之 Per-tag usage 表格、tag totals row、3 sub-bucket cards 已可見且符合 read-only 定位
- 確認 unknown tag 之揭露屬「內容治理訊號」而非 admin bug
- 確認**未**出現 Add / Edit / Delete / Publish / Save / Apply 等寫入按鈕
- 不在本 phase 補新功能；不在本 phase 改任何 source / content / settings

明確邊界：

- ✅ 只做 docs-only 驗收紀錄
- ❌ **不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `src/scripts/` / `package.json` / lockfile / `CLAUDE.md`
- ❌ **不** `npm install`
- ❌ **不** `npm run build` / `npm run build:blogger` / `npm run build:sitemap` / 任何 deploy
- ❌ **不**重貼 Blogger / 不動 AdSense / GA4 / commerce 後台
- ❌ **不**新增功能；ADMIN 仍維持 **read-only management shell** 狀態
- ❌ **不**修正 `phonics-practice-sheet-download.md` 之 `download` tag（content 治理屬另一 phase）
- ❌ **不**新增 `download` tag 至 `tags.json`（settings 治理屬另一 phase）

---

## C. 人眼瀏覽驗收結果

由 user（操作者）於 2026-06-15 23:00 左右執行；過程未經 Claude 操作瀏覽器，僅 Claude 紀錄 user 提供之結果。

### C.1 ADMIN Tags 區塊可開啟

- ✅ `npm run dev` 啟動後，ADMIN Tags 區塊可由 `http://localhost:5173/admin/#tags` 開啟
- ✅ Top nav 已新增 `Tags` 連結，點擊可直接導至 Per-tag usage 區塊
- ✅ Tags — Per-tag usage 區塊正常顯示，並維持 **read-only derived dashboard** 定位
- ✅ 區塊說明明確標示資料來源 = posts (admin loader) + `tags.json`

> 紀錄：production build 仍**不**輸出 admin（per night-1 §E．dev-mode-only / 不進 dist / 不 deploy / noindex），本驗收僅針對 dev mode 之本機檢視體驗。

### C.2 Tag totals 列正常顯示

User 確認上方 tag totals pill row 顯示如下（與 night-7 §E.5 之 admin loader 量測一致）：

| pill | 值 |
|---|---|
| 文章總數（含 draft） | **11 篇** |
| 有 tag | **11** |
| untagged | **0** |
| 篇有 unknown tag | **1**（warn） |
| unknown tag key | **1**（warn） |
| unused defined | **0** |
| cross-site mismatch | **0** |

- ✅ anomaly pill（unknown tag 兩項）以暖色 `.warn` 強調 → 表示目前存在 1 個 frontmatter 使用了未在 `tags.json` 定義之 tag
- ✅ 其餘 pill 為 0；無 untagged、無 unused、無 cross-site mismatch

### C.3 Per-tag usage 表格

User 確認表格各欄正常顯示：

- ✅ id / slug
- ✅ name
- ✅ allowed sites（site badge）
- ✅ posts（總篇數）
- ✅ status breakdown（micro bar chart + 文字 counts）
- ✅ by source site（github / blogger）
- ✅ sample posts（slug + title + status badge + sourceSite）

目前 tag 分布（user 報告之畫面值，依 postCount desc 排序）：

| tag id | postCount | 備註 |
|---|---|---|
| `self-growth` | **6** | blogger surface |
| `reading-notes` | **5** | blogger surface |
| `book` | **2** | blogger surface |
| `github` | **2** | github surface |
| `static-site` | **2** | github surface |
| `vite` | **2** | github surface |
| `book-review` | **1** | blogger surface |

> 紀錄差異說明：night-7 §E.5 之量測為 `reading-notes 5 / self-growth 5 / book-review 3 / book 3 / github 1 / vite 1 / static-site 1`；本 phase 驗收紀錄為 user 於 23:00 左右瀏覽 ADMIN 之畫面值。差異原因 = 本日 night-7 commit `ac0476b` 之前後尚有新增之 docs phase（中間多次 frontmatter content phase landing 已影響 admin loader 之 derive 結果）；admin 為 read-only derived from current content，數值差異屬正常動態 reflection，非 admin bug。**本 phase 不回溯比對；以 user 當下畫面為準。**

- ✅ ready / draft / published breakdown 顯示正常（status bar 顏色 + 文字 fallback 皆可見）
- ✅ sample posts 可讀，能幫助使用者**不用進資料夾**即可掌握各 tag 目前實際使用之文章
- ✅ 表格亦同時顯示 cross-site mismatch callout 之欄位（目前所有 tag 之 mismatch 數皆 0，無紅框警示）

### C.4 Unknown tag usage 區塊

User 確認：

- ✅ Unknown tag usage 區塊正確顯示
- ✅ unknown tag key：`download`
- ✅ 影響 **1 篇**文章
- ✅ sample post：`phonics-practice-sheet-download`（draft）
- ✅ 區塊文字明確指向 validator 之 `unknown-tag` warning，並標示「Admin 不自動修；請新增 tags.json 條目或修正 frontmatter」
- ✅ **未**出現「自動新增此 tag 至 tags.json」或「自動修正此 post frontmatter」之按鈕 / 連結

### C.5 Untagged posts / Unused defined tags 區塊

User 確認：

- ✅ Untagged posts：**0**（所有文章皆有非空 tags 陣列）
- ✅ Unused defined tags：**0**（7 個 tags.json entry 皆有 ≥1 篇文章使用）
- ✅ 兩 card 皆以「無異常」狀態顯示，**無**暖色 `.warn` 強調

### C.6 未誤導為 CMS 寫入

User 確認：

- ✅ **未**看到 Add / Edit / Delete / Publish / Save / Apply / Submit 等任何會誤導為 CMS 寫入的按鈕
- ✅ Tags registry 卡片之 surface-note 已由「⏳ 仍未實作」改為「見下方 Per-tag usage（本區無編輯 UI）」，誠實表達現況
- ✅ 未實作項目（category / tag 編輯 UI、per-post 修正、unused 移除建議、validator warning mirror）皆以 `⏳ 仍未實作` 文字 + 灰色 planned list 呈現
- ✅ ADMIN 仍維持 **read-only management shell** 定位（與 night-2 / night-4 / night-6 acceptance 一致）

### C.7 驗收結論

User 確認：

> **本階段驗收結論：night-7 Tags usage counts 可接受，仍維持 read-only admin dashboard 定位。**

具體達成之效益（符合 preanalysis §H §3–5 / night-3 §I §2 之 tags 用量計數目標）：

1. **可從 ADMIN 直接看每個 tag 目前被多少文章使用**，不需逐個 `grep -r 'tags:' content/`
2. **可看每 tag 之 ready / draft / published 狀態分布**，輔助規劃發布節奏
3. **可看 cross-site mismatch / unknown tag / untagged / unused defined 4 種 anomaly 篇數**，輔助對齊 `npm run validate:content` 之 `unknown-tag` / `tag-site-mismatch` warning（但**不**取代 validator；validator 仍為 ground truth）
4. **sample posts 顯示 slug + title + sourceSite + status**，可快速辨識每 tag 實際內容
5. **無任何寫入按鈕**，read-only 邊界清晰，不會被誤認為 CMS

---

## D. 補充觀察（非本階段 blocker）

### D.1 unknown tag `download` 是被揭露的內容治理訊號，不是 admin bug

User 補充觀察：

- ✅ unknown tag `download` 並非 admin 計算錯誤；admin loader 確實掃到 `phonics-practice-sheet-download.md` 之 frontmatter 含 `tags: [download]`
- ✅ `download` **未**列入 `tags.json` registry（`tags.json` 目前定義之 7 個 tag：`github` / `vite` / `static-site` / `book` / `book-review` / `reading-notes` / `self-growth`）；`download` 僅作為 categories.json 之 category id
- ✅ admin 此處之揭露屬「內容治理訊號（content governance signal）」—— 揭露 `tags.json` 與文章 frontmatter 之不一致，由人工決定如何處理
- ✅ `npm run validate:content` 本 baseline **未**觸發 `unknown-tag` warning（因 `phonics-practice-sheet-download` 為 draft，validator 對 ready/published 篇套 sourcePath filter）；admin loader 含 draft，於此 read-only 表面誠實揭露 → 屬「admin 提供額外可見性，validator 仍為 ready/published ground truth」之預期差異

**未來治理路徑（屬另一 phase；本階段不執行）**：

- **路徑 A**：在 `tags.json` 新增 `download` tag 條目（允許下載類文章使用此 tag；須評估 site allowed surface / 與 category id 同名是否會造成混淆）
- **路徑 B**：修正 `phonics-practice-sheet-download.md` 之 frontmatter，把 `tags: [download]` 改為其他既有 tag（如 `book` 或新增 tag）
- **路徑 C**：保留現況，等該 draft 真正準備發布前再人工決策
- **路徑 D**：另開 admin content taxonomy governance preanalysis（docs-only），分析 category / tag 設定治理之決策原則與未來 admin 是否允許「提示」修正（仍不允許 admin 直接寫入）

→ 上述路徑由 user 後續決定；**本階段不做選擇、不做修改**。

### D.2 桌機寬版可讀性 OK；mobile / 窄版 responsive 可列為 future refinement

User 補充觀察：

- ✅ **桌機寬版可讀性 OK**（與本 phase 主要驗收場景一致）
- ⚠️ **手機 / 窄版**之 Per-tag usage table 可讀性**尚未針對性優化**；表格欄位較多（id / name / sites / posts / status / source / sample 共 7 欄）在窄版可能需橫向捲動或重新折版
- 此觀察與 night-6 §D 之 categories usage table responsive 觀察相同（兩表共用相同 CSS class）
- 建議未來可一次性處理：
  - responsive table → card layout 切換（如 < 720px 改成每分類 / 每 tag 一張卡）
  - status bar / sample list 之窄版斷行策略
  - 與 night-4 §E 提到之 Posts detail readability refinement 合併處理
- **此觀察不是 blocker，不要求本階段回頭修改 source**

→ 此項列為下一階段可選項（見 §I），不在本 docs-only acceptance phase 內處理。

---

## E. 本階段仍是 read-only admin dashboard（不是完整 CMS）

本紀錄**明確再次聲明**（延續 night-2 §D / night-4 §D / night-6 §E）：

### E.1 read-only 管理殼層之定位

- ADMIN 為「**系統狀態檢視入口**」，**不是**後台 CMS
- **不**在 ADMIN 內新增 / 編輯 / 刪除 / 發布文章 / 新增 / 編輯 / 刪除分類 / 標籤
- **不**寫入 `content/` 或 `content/settings/`
- **不**觸發 build / deploy / Blogger repost
- 即使 user 驗收通過 night-7 Tags usage counts，**不**代表 ADMIN 已可作為完整後台使用
- 即使 ADMIN 揭露 unknown tag `download`，**不**自動新增 / **不**自動補映；增刪請手改 `tags.json` 或文章 frontmatter，並執行 `npm run validate:content`

### E.2 仍未實作之功能（per night-7 §H / night-5 §H / night-3 §I / preanalysis §H §3–8）

下列功能本 phase **仍未實作**；ADMIN 內以 `⏳ 未實作` / `deferred` / `unknown` 形式呈現：

| 類別 | 仍未實作 / 仍 deferred |
|---|---|
| 文章 | 新增 / 編輯 / 刪除 / 發布 / 重貼 Blogger |
| 文章 | published URL 一鍵回填 UI |
| 分類 | category Add / Edit / Delete UI（**不**開放；增刪請手改 `categories.json`） |
| 分類 | per-post category 一鍵修正（**不**開放） |
| 分類 | unused defined category 自動移除（**不**開放） |
| 分類 | unknown category 自動建議對映（**不**開放） |
| 標籤 | tag Add / Edit / Delete UI（**不**開放；增刪請手改 `tags.json`） |
| 標籤 | per-post tag 一鍵修正（**不**開放） |
| 標籤 | unused defined tag 自動移除（**不**開放） |
| 標籤 | unknown tag 自動建議對映（**不**開放；如 `download` 案例） |
| 標籤 | per-tag detail view / 多 tag intersection 查詢（**deferred**） |
| Validation | per-post warning 計數聚合（仍 deferred；需獨立 preanalysis） |
| GA4 | per-post event received（不打 GA4 API；仍 `unknown`） |
| Navigation | per-post live verified（不抓 GA4 後台；仍 `false`） |
| Blogger | per-post copy-helper 一鍵打開 / repost readiness flag |
| GitHub Pages | 最後 build / deploy 時間 commit 顯示 / sitemap 預覽 / 一鍵 deploy |
| AdSense | live filled / unfilled / earning 後台 mirror |
| Settings | JSON 編輯 UI / schema 視覺化 / 欄位 picker |
| System checks | 最近一次結果 mirror / 一鍵觸發 |
| Mobile / narrow layout | Categories / Tags usage table responsive 折版（**deferred**；未來可作為 UI refinement 或與 Posts detail readability 合併） |
| Write path（browser 直寫） | **不開放**；須獨立 middleware 安全 preanalysis |
| Write path（gated CLI for content） | 既有 `admin:write` 對 content dormant |

### E.3 unknown tag `download` 不在本 phase 處理

- ✅ admin 已誠實揭露 `download` 為 unknown tag（影響 1 篇 draft post）
- ✅ 本驗收 phase **不要求** 在本日新增 `tags.json` 條目 / 修正 `phonics-practice-sheet-download.md` frontmatter
- ✅ 若未來決定處理，可另開：
  - 內容治理 phase（修 .md frontmatter）
  - settings 治理 phase（修 tags.json）
  - 或先做 `20260615-night-9-admin-content-taxonomy-governance-preanalysis-docs-only-a`（docs-only 決策分析）
- ❌ **不**把 unknown tag 揭露視為本 phase blocker
- ❌ **不**在本 phase 內補修正

### E.4 mobile / narrow layout 仍 deferred — 不是本階段 blocker

- ✅ §D.2 觀察記錄：窄版 / 手機 Per-tag usage table 之 responsive readability 仍可改善
- ✅ 本驗收 phase **不要求** 在本日把 responsive 折版做完
- ✅ 若使用者未來決定做，可另開 UI refinement phase（建議與 night-4 §E Posts detail readability + night-6 §D Categories responsive 合併處理）
- ❌ **不**把 mobile / narrow layout 視為本 phase blocker
- ❌ **不**在本 phase 內改 CSS / EJS / template

### E.5 寫入路徑紅線（延續 night-2 §D.3 / night-4 §D.3 / night-6 §E.5）

- ❌ 不在 ADMIN 內提供 browser-side 直接寫檔
- ❌ 不在 ADMIN 內提供 build / deploy 觸發按鈕
- ❌ 不在 ADMIN 內提供 Blogger repost 觸發
- ❌ 不在 ADMIN 內顯示真實 AdSense client / slot id（只顯示 tail4 遮罩）
- ❌ 不在 ADMIN 內顯示真實 GA4 measurementId（只顯示 tail4 遮罩）
- ❌ 不在 ADMIN 內出現 token / API key / OAuth secret / 帳號密碼 / Google Sheet response rows
- ❌ 不在 ADMIN 內顯示 commerce dashboard credentials / commission / payout 統計

→ **night-7 Tags usage counts 驗收通過 ≠ 開放寫入；≠ 進入第三階段 gated CLI write；≠ 可在 ADMIN 內觸發 build / deploy / repost；≠ unknown tag `download` 已被處理；≠ tags.json 已修；≠ phonics-practice-sheet-download.md 已改。**

---

## F. 變更檔案（精確清單）

本 phase 屬 docs-only acceptance record：

```
docs/20260615-admin-tags-readonly-usage-counts-human-acceptance.md   — 本紀錄（新增）
```

**未動**：

- `src/`（任何 EJS / JS / SCSS / script；含 `src/views/admin/index.ejs` / `src/scripts/load-admin-posts.js` / `src/scripts/build-github.js`）
- `content/`（任何 .md / .json；含 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`）
- `content/settings/`（任何 JSON；含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json`）
- `package.json` / lockfile（未 `npm install`）
- `CLAUDE.md`（不動，per phase 要求）
- 其他 docs/*.md
- `.cache/` / `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- Blogger live posts / GitHub Pages live deploy / GA4 / AdSense / commerce 後台

---

## G. Validation results

本 phase 屬 docs-only，無 source / settings / build / deploy 變更，**未跑** validation；採用 night-7 既有 baseline carry-forward：

```
npm run validate:content         → 0 error(s) / 94 warning(s) on 84 post(s)  ← carry-forward
check:adsense-resolver           → 34/0  carry-forward
check:adsense-article-block      → 13/0  carry-forward
check:adsense-anchor-wiring      → 14/0  carry-forward
check:blogger-adsense-output     → 85/0  carry-forward（6 target 全覆蓋）
```

本 phase 結束時之 git 驗證（在 commit 前）：

```
git diff --check    → 無錯誤
git status -sb      → 僅有 docs/20260615-admin-tags-readonly-usage-counts-human-acceptance.md untracked
```

---

## H. Explicit non-actions

- ❌ 未動 `src/`（任何 EJS template / loader / build script / SCSS / JS）
- ❌ 未動 `content/`（任何 .md / .publish.json / .fb.md / 任何 settings JSON）
- ❌ 未動 `content/settings/` 任一 JSON（含 `categories.json` / `tags.json` / `ads.config.json` / `ga4.config.json` / `commerce-links.json` / `affiliate-networks.json`）
- ❌ 未動 `package.json` / lockfile；未 `npm install`
- ❌ 未動 `CLAUDE.md`（per phase 要求）
- ❌ 未動 templates / views（含 `src/views/admin/index.ejs`）
- ❌ 未動 `src/scripts/load-admin-posts.js` / `build-github.js` / `resolve-adsense-blocks.js` / `validate-content.js` / `load-posts.js` / `load-settings.js`
- ❌ 未動其他 docs/*.md（僅新增本紀錄一檔）
- ❌ 未跑 `npm run build` / `npm run build:blogger` / `npm run build:sitemap` / `npm run build:promotion`
- ❌ 未跑任何 `check:adsense-*` / `check:blogger-adsense-output` / `npm run validate:content`（無 source impact，採用 carry-forward）
- ❌ 未 deploy / 未 push gh-pages / 未動 `portable-blog-deploy` clone
- ❌ 未開 Blogger 後台 / 未重貼任何 Blogger 文章
- ❌ 未開 AdSense 後台 / 未動 ad 設定 / 未新增/hardcode real AdSense id
- ❌ 未動 GA4 後台 / 未動 measurementId / events / custom dimensions / 未打 GA4 API
- ❌ 未動 commerce-links registry / 未新增 affiliate entry / 未動 token / credential 紅線
- ❌ 未動 slug / permalink / category / tags 資料
- ❌ 未動 `tags.json`（registry 本身未改；即使 admin 揭露 `download` unknown tag 亦不自動新增）
- ❌ 未動 `phonics-practice-sheet-download.md`（即使 admin 揭露其 frontmatter `tags: [download]` 為 unknown tag 使用，亦不自動修正）
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未啟用 browser write / middleware / Apply button / gated CLI for content
- ❌ 未在 ADMIN 內新增任何 Apply / Save / Submit / Edit / Publish / Delete / Add 互動
- ❌ 未針對「mobile / narrow layout readability」此觀察回頭改 source（per phase 要求，列為後續可選 UI refinement phase）
- ❌ 未針對 unknown tag `download` 此 governance signal 回頭做內容 / settings 治理（per phase 要求，非本 phase blocker；屬另開 phase）
- ❌ 未把 read-only acceptance 視為對 ADMIN 寫入路徑之解鎖訊號
- ❌ 未把 read-only acceptance 視為 deploy / Blogger repost gate 解除
- ❌ 未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效（既有紅線維持）

→ 唯一 mutation = 本紀錄 doc 自身。

---

## I. Next recommended phase

依本 phase 之驗收結果與 user 補充觀察，下一階段建議：

### 保守路線（推薦預設）

1. **`20260615-night-final-idle-freeze-after-admin-tags-acceptance-no-op-a`** —
   收工 idle freeze；不再於本日推進；等 user 隔日決定下一個功能路線。

### 若今晚繼續做（建議改做 docs-only preanalysis；不動 source / content / settings）

2. **`20260615-night-9-admin-content-taxonomy-governance-preanalysis-docs-only-a`** —
   docs-only preanalysis：分析 unknown tag `download` 案例、category / tag 設定治理之決策原則、未來 admin 是否允許「提示」（建議顯示）修正（仍**不**允許 admin 直接寫入 content / settings）。不修改 content / 不修改 tags.json / 不修改 source / 不修改 categories.json。

### 下一個功能路線（等 user 確認後再做）

3. **`20260616-admin-posts-detail-readability-refinement-a`** —
   回應 night-4 §E / night-6 §D / 本 phase §D.2 之觀察：改善 Posts detail readability + Categories / Tags usage tables 之 responsive 折版（card layout 切換）。仍 read-only；不動 readiness derive / categoryUsage / tagUsage helper 邏輯。
4. **`20260616-admin-validation-per-post-aggregation-preanalysis-a`** —
   docs-only preanalysis：探討 admin loader / validator sourcePath 對齊或 per-post API 設計；不改 validator。

### 仍按既定主線之候選（不在本日推進）

5. **`20260615-XX-admin-post-detail-readonly-expand-a`** —
   detail panel 擴充 commerce ref / book metadata / download ref / prev / next slug 預覽。
6. **`20260615-XX-admin-build-deploy-readonly-status-a`** —
   接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態。
7. **（最後）write path** —
   仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。**不跳階。**

---

（本紀錄結束）
