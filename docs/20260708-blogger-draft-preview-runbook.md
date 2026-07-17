# Blogger draft-preview runbook（docs-only 人工預覽流程）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **runbook**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 觸發來源：Phase 1 第二次人工 E2E（`docs/20260708-phase1-second-manual-e2e-result.md` §E P1-2）的 P1，以及 `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §9 建議之 **S1（最小、推薦）**。
- 本輪界線（docs-only）：**不**修改 `build:blogger` 行為、**不**新增 guard、**不**新增 npm script、**不**新增 preview-only script、**不** build、**不**產 dist、**不** deploy、**不**新增測試文章 / artifact、**不**碰 deploy clone 寫入、**不**碰 DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC。僅落地一份可重複的人工 runbook。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `743bea7` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 frozen baseline。Deploy clone 僅 read-only 讀取，未寫入。

> 註：§0 為本 runbook **建立當下**的 boot 快照；每次實際執行 runbook 時，請於 §G 結果紀錄模板重新登記當下 short HEAD。

---

## A. Runbook 目的

- 提供一條**可重複**的手動流程，讓 Dean 在**不發布 Blogger、不 deploy GitHub Pages、不 commit 測試文章**的前提下，於 Blogger 後台**草稿 / 預覽**一篇文章的實際外觀。
- **釐清設計語意**：`build:blogger` 是**正式 build**，其只輸出 `draft !== true` 且 `status ∈ {ready, published}` 的文章、**不輸出 draft**，這是**正確且必要**的設計（deploy 安全的根基；CLAUDE.md §23「任何 draft 文章不得出現在正式 dist」）。這不是 bug。
- **定位**：本 runbook 是一條**人工 preview workaround**（暫時把目標文章改成 build-eligible → 產 HTML → 貼 Blogger 草稿 → 改回 → 清理）。**它不代表正式發布流程**；跑完 runbook ≠ 已發布 Blogger、≠ 已 deploy GitHub Pages。
- 設計依據見 `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（§2 eligibility 規則、§7 Option A、§8 推薦理由）。

---

## B. 適用範圍

適用：

- ✅ 想在本機 / Blogger 後台**預覽**一篇 Blogger 文章的實際外觀（HTML 渲染、版面、CTA、廣告位置、RWD）。
- ✅ Blogger **draft / preview only**（僅存草稿或用 Blogger 預覽工具，**不**按下發布）。

不適用 / 不做：

- ❌ **不發布 Blogger**（不按發布鍵）。
- ❌ **不 deploy GitHub Pages**（不碰 deploy clone、不 push gh-pages）。
- ❌ **不 commit 測試文章**（測試文章與 `dist-blogger/` 輸出皆為一次性 artifact，測完清理）。
- ❌ **不**改 `build:blogger` 行為、**不**新增 guard / npm script / preview-only script。
- ❌ **不**碰 DNS / GitHub Pages settings / AdSense / GA4 / GSC 後台。

---

## C. 前置檢查（read-only）

執行 runbook 前，先確認 repo 乾淨、就緒 checks 通過：

```bash
# 1) 就緒契約（checks-only，不 build / deploy）
npm run check:phase1-readiness-contract

# 2) 內容驗證（0 error 才可繼續；warning 不擋）
npm run validate:content

# 3) 確認 source working tree 乾淨
git status --short          # 期望：無輸出（clean）

# 4) 確認不是在 gh-pages / deploy clone 操作
git rev-parse --abbrev-ref HEAD    # 期望：main（不是 gh-pages）
pwd                                # 期望：.../portable-blog-system（不是 .../portable-blog-deploy）
```

判定門檻：

- `check:phase1-readiness-contract` exit 0。
- `validate:content` **0 error**（warning 可存在，不擋）。
- `git status --short` clean。
- 當前在 **source repo / `main`**，**不在** deploy clone、**不在** `gh-pages`。

> 任一項不符：**停止，不要改檔**，先回報 / 排除後再進行。

---

## C.5 B1 preview navigator（optional read-only lookup）

- 觸發時機：當要確認某篇 Blogger 文章有哪些 candidate、`dist-blogger/posts/<slug>/` 是否已產出四個輸出檔、或想在 paste 前一步取得 slug 對應之 artifact 存在性與 mtime 時。
- 定位：B1 = **對既有 Blogger build artifacts 的唯讀導覽與檢查工具**。navigator **不**渲染 preview HTML、**不**執行 `build:blogger`、**不**建立 `dist-blogger-preview/`、**不**修改任何 `.md` / `.publish.json` / `settings/*.json` / `dist-blogger/*`、**不**呼叫 Blogger / Google / AdSense / GA4 / Search Console API、**不** deploy、**不** commit、**不** push、**不**取代 Blogger 後台 Preview、**不**代表 publish request。
- 與本 runbook 之關係：`C.5` 為 **可選** 步驟，位在 §C 前置檢查之後、§D 操作流程之前；也可於 §D-6（查看輸出）時交叉核對。**不**能取代 §D-4（暫改 status/draft）或 §D-7（複製 HTML 到 Blogger）。
- 界線 recap：navigator warning-only；unknown slug / missing artifact / draft filtered 皆 exit 0，唯有 script crash / IO error 才 exit 1；navigator **不代表** artifact 有效 / **不代表**文章已發布 / **不代表** Blogger 後台已建立草稿 / **不代表** sidecar 真值完整 / **不代表** backfill 完成。

### C.5-1. 列出可檢查項目（list mode）

```bash
npm run check:blogger-preview
```

輸出重點：

- header：`check-blogger-preview (read-only navigator; warning-only)` + `mode: list`
- summary：`dist-blogger root` / `candidates` / `filtered-out` / `missing-slug` / `parse-failures` / `build command`
- `---- candidates ----`：blogger-enabled 且非 draft 之文章；逐篇顯示 slug / mode（`full` / `summary` / `redirect-card`）/ source（`blogger` / `github-cross`）/ source path，以及對應 `dist-blogger/posts/<slug>/` 四檔（`post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json`）之 `exists` / `size` / `mtime`。missing 檔以 `MISSING` 標記。
- `---- filtered-out ----`：blogger-enabled 但為 draft / non-ready 之文章；逐篇附 `filter reason`（例如 `draft:true` / `status:archived`），並指向本 runbook §D-4（暫改 status/draft）之 preview workaround。
- `pointers`：runbook / sanity / admin export / preanalysis 四份文件路徑。
- trailer：`PASS blogger preview navigator (read-only; warning-only; no writes performed).`

用途：一次看清「哪些篇會進 build、哪些被濾掉、哪些 dist 檔缺」。navigator **不**自動 `build:blogger`；artifacts 缺失時仍需 §D-5 或 Admin export 觸發之 build。

### C.5-2. 聚焦單一 slug（focus mode）

```bash
npm run check:blogger-preview -- --slug <slug>
```

- 已知 slug + artifacts 完整：advice = `dist-blogger/posts/<slug>/ complete — open post.html and paste into Blogger HTML mode (see docs/20260708-blogger-draft-preview-runbook.md §D-7).`
- 已知 slug + dist folder 不存在：advice 指向 `npm run build:blogger`。
- 已知 slug + folder 存在但某檔缺：advice 指向 re-run `npm run build:blogger`。
- Filtered slug（draft / non-ready）：報 `filter reason` + advice 指向本 runbook §D-4 之 preview workaround。
- Unknown slug（不在 candidates 也不在 filtered-out）：報 `source path: (not found)` + advice 提示 slug 有誤或 `frontmatter's publishTargets.blogger.enabled` 未開；exit 0。
- Frontmatter parse error：advice attach 錯誤訊息；exit 0。

exit 0 **不等於**「文章有效」/「已發布」/「backfill 完成」；navigator 只報告 source / dist artifact 之存在性與 metadata。發布判定仍以 §D + 人工 Blogger Preview 為準。

### C.5-3. JSON snapshot

```bash
npm run check:blogger-preview -- --json
npm run check:blogger-preview -- --slug <slug> --json
```

- 用途：機器可讀 JSON snapshot 至 stdout；適合 diff / archive / 保存本次 navigator 觀察結果。
- schema：包含 `mode` / `candidateCount` / `filteredOutCount` / `missingSlugCount` / `parseFailureCount` / `buildCommand` / `distBloggerRoot` / `distBloggerRootExists` / `pointers` / focus 模式再加 `slug` / `entry` / `outputs` / `advice`；list 模式則加 `entries[]` / `filteredOut[]` / `missingSlug[]` / `parseFailures[]`。
- 界線：**不**等同 Blogger API payload、**不**代表 publish request、**不**含 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` 之推測值；deterministic contract 只涵蓋 helper normalized payload（`mtimeIso` / `size` / `generatedAtNote` 為 volatile，`check:blogger-preview-smoke` 之 determinism 檢查會 normalize 掉這三個欄位）。

### C.5-4. Help + no-op --dry-run

```bash
npm run check:blogger-preview -- --help
npm run check:blogger-preview -- --dry-run
```

- `--help`：印 usage + behavior + See also。exit 0。
- `--dry-run`：navigator 本無寫入副作用；`--dry-run` 為 CLI shape parity 之 no-op，行為與 list mode 相同，僅於 stderr 印 `[check-blogger-preview] note: --dry-run is a no-op (navigator is read-only)`。**不**模擬 build、**不**模擬 publish、**不**建立 sandbox `dist-blogger-preview/`。若未來有 B2 draft-aware preview build 實作，`--dry-run` 之語意才會實質擴展；本階段保留旗標形狀。

### C.5-5. 常見狀態與下一步

| Navigator 狀態 | 意義 | 下一步 |
| --- | --- | --- |
| candidate found + artifacts 全數 exists | 該篇進 build、四檔皆已產出 | 依 §D-6..§D-7 開 `post.html`，切 Blogger HTML 模式貼上、按預覽 |
| candidate found + folder MISSING | 該篇進 build，但尚未執行 `build:blogger` 或曾清理 | 依 §D-5 執行 `npm run validate:content` + `npm run build:blogger`；再回 C.5-2 focus 確認 |
| candidate found + 某檔 MISSING | build 曾中斷或人工刪過該檔 | 重跑 §D-5 之 `npm run build:blogger`；不得手動創空檔頂替 |
| filtered slug（draft / non-ready）| 該篇為 draft、不會進正式 `dist-blogger/` | 若要 preview 走 §D-4 workaround（暫改 status:"ready" / draft:false）+ §D-5..§D-11 全流程 |
| unknown slug | 拼字錯 / frontmatter `publishTargets.blogger.enabled` 未開 / 該檔尚未存在 | 回 `npm run check:blogger-preview`（無 `--slug`）之 list mode 對 slug；或檢查 frontmatter |
| frontmatter parse error | 該檔 YAML 壞掉 | 手動修 frontmatter；**不**略過 parse error 硬走 §D-5 或 §D-7 |

界線提醒：以上任一狀態 navigator 皆 exit 0；navigator 不是 publish gate、不是 build gate、不是 backfill guard、不是 Blogger 後台 Preview 之替代。

---

## C.6 B2 draft-aware preview build（alternative；**不需**暫改 frontmatter）

自 Phase 20260717-B2-c 起，draft 可**直接**產出預覽 HTML，**不必**走 §D-4 的「暫改 `status: ready` + `draft: false`」再於 §D-10 改回：

```bash
npm run build:blogger-preview -- --slug=<slug>
```

產出（**皆帶 `PREVIEW-ONLY / NOT FOR DEPLOY` 標記**）：

```
dist-blogger-preview/posts/<slug>/post.html          # Blogger 可貼 HTML（檔首為 preview marker 註解）
dist-blogger-preview/posts/<slug>/copy-helper.txt    # 檔首為 preview 橫幅
dist-blogger-preview/posts/<slug>/meta.json          # 含 preview: { previewOnly: true, notForDeploy: true, ... }
```

要點：

- **不改 frontmatter**、**不動正式 `dist-blogger/`**、不 deploy、不需 Blogger 登入、零網路。
- 與正式 `build:blogger` **共用同一 renderer 與同一 EJS 模板** → 外觀等同正式輸出（差異僅 preview marker）。
- 刻意**不產** `publish-checklist.txt`（preview 產物不供正式發布流程使用）。
- 強制指定單一 slug；`--apply` / `--deploy` / `--publish` / `--output` 一律 hard-fail。
- `dist-blogger-preview/` 已 gitignored；貼 Blogger 前請**移除檔首 marker 註解**（或直接複製 `<div class="lab-blogger-article">` 起之本體）。
- 只要「產出計畫」而不要產檔：`npm run blogger:plan-preview -- --slug=<slug>`（dry-run only）。

接續步驟同 §D-7 起（貼 Blogger → 存 draft → preview → 依 sanity checklist 驗），但**可略過** §D-4 與 §D-10（無 frontmatter 需要改回），§D-11 之清理對象改為 `dist-blogger-preview/`。

> §D 原 10 步流程**保留不刪**：仍為 fallback，且在需要驗證「正式 `dist-blogger/` 真實輸出」時仍應使用。
> 詳細契約 / 安全邊界 / parity 證明見 `docs/20260717-blogger-preview-artifact-builder-b2-phase-c.md`。

---

## D. 操作流程

> ⚠️ 全程界線：只到 Blogger **draft / preview**；不發布、不 deploy、不 commit 測試文章。
> 💡 自 2026-07-17 起，若只是要看 draft 外觀，可改用 §C.6 之 `build:blogger-preview`（不需 §D-4 / §D-10 的暫改 frontmatter）。

1. **在 Admin new post draft 填寫文章。**
   `npm run dev` → 開 `/admin/#new-post-draft`（dev-mode-only、noindex、不進 prod build）。填 title / slug / category（registry-bound）/ tags（registry）/ description / searchDescription 等。

2. **Copy markdown。**
   用 Admin 的 **Copy markdown**（或 Download `.md`）取得匯出內容。注意：Admin 匯出**恆為** `status:"draft"` + `draft:true`（`admin-markdown-export.js` 契約；`check:admin-markdown-export` 256/256 鎖定），這是刻意設計。

3. **貼成暫時測試檔。**
   把 markdown 存成 `content/blogger/posts/<test-filename>.md`（一次性測試檔，**測完會清理、不 commit**）。

4. **為了讓 `build:blogger` 輸出 HTML，人工 preview 時暫時設定：**
   - `status: "ready"`
   - `draft: false`
   - `cover` 使用**有效 placeholder 或正式圖**，**不要**用 `www.test.com` 這類假 URL（假 cover 會讓 JSON-LD image 無意義，且不可用於正式發布；見 §E）。
   - category / tags 使用 registry 內既有值，避免 category / tag mismatch（否則 `validate:content` 會出錯或警告）。

   > 這一步是本 runbook 的核心 workaround：`build:blogger` 只收 build-eligible（`draft !== true` 且 `status ∈ {ready, published}`）的文章；draft 一律不產生任何 `dist-blogger/` 輸出（`load-posts.js` 之 `classify`）。此暫改**僅供本機預覽**，§D-10 會改回、§D-11 會清理。

5. **執行：**
   ```bash
   npm run validate:content
   npm run build:blogger
   ```
   `validate:content` 應為 **0 error**（若因假 cover / mismatch 出 error，回 §D-4 修正測試資料，不要硬 build）。

6. **查看輸出。**
   到 Admin **Blogger Export** 頁查看 per-post output paths，或直接打開 `dist-blogger/posts/<slug>/` 下四個輸出檔：
   ```
   dist-blogger/posts/<slug>/post.html               # Blogger 可貼 HTML
   dist-blogger/posts/<slug>/copy-helper.txt          # 複製輔助
   dist-blogger/posts/<slug>/publish-checklist.txt    # 發布前檢查清單
   dist-blogger/posts/<slug>/meta.json                # metadata
   ```
   亦可用 B1 preview navigator 一步確認 slug 對應之四檔存在性與 mtime（純唯讀、不重 build、不 modify）：
   ```bash
   npm run check:blogger-preview -- --slug <slug>
   ```
   詳見 §C.5-2。

7. **複製 HTML 到 Blogger HTML 模式。**
   從 `dist-blogger/posts/<slug>/post.html`（或 `copy-helper.txt`）複製 **HTML** 內容（不是 raw Markdown），在 Blogger 後台**切到 HTML 檢視模式**再貼上（不要貼進 Compose / 純文字模式，否則會顯示未渲染的 `##` / `[text](url)`；見 §E）。

8. **Blogger 只儲存草稿與 Preview，不發布。**
   用 Blogger 的**儲存草稿 / 預覽**看外觀（標題、段落、圖片、連結、CTA、廣告位置、RWD 桌機 + 手機）。**不要按發布。**

9. **檢查渲染是否正確。**
   確認 raw Markdown 語法**已消失**（沒有可見的 `##` / `[text](url)`），且 `h2` / `p` / `ul` / `a` / `blockquote` / `code` 等元素在 Blogger 預覽中**正常渲染**。若仍看到 raw Markdown → 代表貼成純文字或貼到 Markdown 而非 HTML，回 §D-7 重貼。

10. **改回 draft。**
    把 §D-4 的暫改**還原**：`status` 改回 `"draft"`、`draft` 改回 `true`（或直接於 §D-11 移除整個測試檔）。目的：避免測試檔在下次正式 `build:blogger` / deploy 被當成 ready 輸出（§F 最實際的隱患）。

11. **檢查 console / 404 / broken image，然後清理。**
    - 在 Blogger preview（及必要時 GitHub Pages readonly）用 DevTools 檢查 console error / 404 / broken image，記入 §H。若 Blogger mobile preview 出現水平捲軸，走 §F overflow debug 流程並回填 §H 對應欄位。
    - **清理 artifact：**
      - 移出或刪除 `content/blogger/posts/<test>.md`。
      - 刪除 `dist-blogger/posts/<slug>/` 測試輸出（或整個 `dist-blogger/` 不 commit）。
      - `git status --short` **必須回到 clean**（無殘留 artifact）。

---

## E. 常見錯誤與判斷

- **Blogger Preview 看到 `##` 或 `[text](url)`**：代表貼到的是 **raw Markdown**，不是 HTML。→ 回 §D-7/§D-8，改複製 `post.html` 的 HTML，並在 Blogger **HTML 模式**貼上。
- **`build:blogger` 沒輸出測試文章**：通常是 `status: draft` / `draft: true` 被正確濾除（`classify`），**不是 bug**。→ 確認 §D-4 已暫改 `status: "ready"` / `draft: false`。
- **fake cover URL 造成 JSON-LD image 奇怪**：是**測試資料問題**，不是系統缺陷，且**不可用於正式發布**。→ 用有效 placeholder / 正式圖；正式文章嚴禁假 cover。
- **category / tag mismatch**：`category` 必須存在於 `categories.json`、`tags` 必須存在於 `tags.json`（CLAUDE.md §14/§15）。mismatch 會讓 `validate:content` 出錯 / 警告。→ 用 registry 內既有值。
- **Blogger mobile preview 出現水平捲軸**：先記 **P1 待確認**，**不**直接判 P0（來源可能是 Blogger 預覽工具列 / Blogger 模板 / 廣告區 / code 版面，需 follow-up 驗證再定性）。→ **完整重測方式見 §F**。
- **Chrome extension `contentscript.js` warning**：通常**不算專案 P0**（研判為瀏覽器擴充套件相關，非本專案輸出）。

---

## F. Blogger mobile preview 水平捲軸 overflow debug（併入 audit §5）

觸發：Blogger draft / preview（尤其 mobile viewport）出現水平捲軸時，**先按本節定位真正 overflowing element**，取得元素級證據後，再依 §F-4 分級。設計背景 / 假說清單 / CSS 防護盤點見 `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（§3 假說、§4 防護 gap、§5 debug 流程原文）；本節為該 audit 之 Option A 落地版。

### F-1. 先分類，再處理（不要立刻判系統 bug）

- 出現水平捲軸時，**先標為 P1 / needs reproduction**（等同 audit §6 之 P1 位置）；**不**逕自判為系統 P0 / 系統 CSS bug、也**不**逕自關閉為 external Blogger preview artifact。
- 需要 DevTools 定位 overflowing element 後，才進 §F-4 分級。
- 界線：本節全程 read-only + draft / preview；**不**修 CSS、**不** build / deploy、**不**發布 Blogger、**不**動 Blogger theme（若日後 Blogger-scope CSS hardening，須另開獨立 phase + explicit approval，見 audit §7 Option B）。

### F-2. DevTools 人工檢查步驟

前置：沿本 runbook §D 產生 build-eligible 測試文章、貼進 Blogger **HTML 模式**，儲存 draft、按預覽（不發布、不 deploy）。

1. 開 Blogger Preview（不按發布）。
2. 開瀏覽器 DevTools → 切 device toolbar → 選 **mobile viewport**（例如 375px 寬）。
3. 開 DevTools **Elements**。
4. 逐層 hover / 展開，找出 `scrollWidth` 大於 viewport（`document.documentElement.clientWidth`）、或 bounding rect 右緣超出 viewport 的元素。
5. 分辨 offender 屬於下列哪一類（判定依據，非結論）：
   - Blogger **preview toolbar** 或 preview 外殼 iframe（**非**本專案輸出）
   - Blogger **theme / template** 外層容器（Blogger 主題，**非**本專案輸出）
   - 本專案輸出的 **article HTML**（`.lab-blogger-article` / `.lab-article__body` 及其子節點）
   - **adsbygoogle** / ad iframe（`ins.adsbygoogle` / `.lab-ad-slot`）
   - **code block**（`pre` / `code`）
   - **table**（`.lab-blogger-article table`）
   - **long URL / long unbroken text**（`a` / `p` / `li` 內未斷字長字元）
   - **image / cover**（`.lab-blogger-article img`）
   - unknown（無法歸類）
6. 記錄 offender 之 `tag` / `class` / `id` / `scrollWidth` / viewport width，並在 §H 結果紀錄模板對應欄位登記。

### F-3. Console snippet（一次列出可能超寬元素）

若預覽在 iframe 內，DevTools Console 上方 context 下拉需先切到該 iframe context，再貼入以下 snippet：

```js
Array.from(document.querySelectorAll('*'))
  .filter((el) => el.scrollWidth > document.documentElement.clientWidth)
  .map((el) => ({
    tag: el.tagName,
    className: el.className,
    id: el.id,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    text: (el.textContent || '').slice(0, 80)
  }))
```

用途：一次列出所有 `scrollWidth > viewport clientWidth` 的元素，含 `tag` / `className` / `id` / `scrollWidth` / `clientWidth` / 前 80 字內容，供人工判讀。此 snippet **只讀** DOM、不修改頁面；不寫入任何 storage、不觸發 network。若需視覺高亮最寬 offender，可自行加 outline，但本 runbook 僅需上述列表足以定位。

### F-4. 判斷規則（依 §F-2 / §F-3 結果套用）

| offender 所屬 | 判定 |
| --- | --- |
| Blogger preview toolbar / 瀏覽器擴充套件 / Blogger 外層 iframe 本身 | **不算系統 P0**；記為 external Blogger preview artifact，不進 CSS 改動清單。 |
| 本專案 `.lab-blogger-article` 內的 `pre` / `code` / `table` / `.lab-ad-slot` / `img` / 長 URL / 長不斷字文字 | **維持 P1**；下一個 session 才**考慮** Blogger-only CSS scope hardening（audit §7 Option B）。 |
| 導致主要內容被裁切、無法閱讀，或手機版嚴重破版 | **升 P0**（阻擋性）。 |
| 只在 Blogger preview 外殼出現、正式 preview content（`.lab-blogger-article` 內部）無 offender | **降 P2 / external artifact**（僅於 runbook 註記 Blogger 主題 / 預覽層現象）。 |

**下一步限制**：即使定性為專案輸出來源，本 runbook 也**不要求**、更**不允許**在本輪直接改 CSS。CSS 變更屬 code 變更，須另開獨立 phase + explicit approval；若日後真的走 Blogger-scope hardening，須遵守 audit §7 Option B 之強約束（只動 `.lab-blogger-article` Blogger scope，**不得**改變已 live-accepted 的 GitHub Pages 輸出）。

### F-5. 交叉驗證（可選）

在 GitHub Pages readonly mobile 用同一 snippet 跑一次同篇（或等價內容）：

- 若 GitHub Pages 也復現同一 `lab-*` offender → 強化「系統輸出來源」假說（分級可升 P0 / 至少維持 P1）。
- 若 GitHub Pages **不**復現、只 Blogger 復現 → 指向 Blogger 主題 / preview 或 Blogger 端缺 page-level 保護（GitHub 端有 `.lab-site { overflow-x: clip }`，Blogger 端刻意無；見 audit §4）。

### F-6. 清理與紀錄

- Debug 結束後仍需依 §D-10 / §D-11 還原測試檔 + 清理 `dist-blogger/`；`git status --short` 必須回到 clean。
- 元素級證據（offender tag / class / scrollWidth）與分級判定，登記在 §H 結果紀錄模板對應欄位（Horizontal scrollbar observed / Offending element found / Offending selector / Likely source / Classification / Screenshot note）。

---

## G. 不可做事項

- ❌ **不要 commit 測試文章**（測試檔與 `dist-blogger/` 輸出皆一次性、測完清理）。
- ❌ **不要發布 Blogger**（僅到 draft / preview）。
- ❌ **不要 deploy GitHub Pages**（不碰 deploy clone、不 push gh-pages）。
- ❌ **不要把 `build:blogger` 改成輸出 draft**（放寬 = 違反 CLAUDE.md §23；見 inventory §6.2）。
- ❌ **不要用假 cover URL 做正式文章**（假 cover 僅限本機一次性預覽，且需為有效 URL）。
- ❌ **不要把 Preview workaround 當正式 publish 流程**（跑完 runbook ≠ 已發布）。

---

## H. 結果紀錄模板

每次執行 runbook 時複製一份填寫（PASS / FAIL / N/A 由 Dean 判定，勿代填）：

| 欄位 | 值 |
| --- | --- |
| Test time | |
| Tester | |
| Article title / slug | |
| Source HEAD（short） | |
| Deploy HEAD（short） | |
| `build:blogger` result | |
| Blogger Preview result | |
| GitHub Pages readonly result | |
| P0 / P1 / P2 | |
| Cleanup status（git status --short clean?） | |
| Horizontal scrollbar observed（§F）| yes / no |
| Offending element found（§F-2）| yes / no |
| Offending selector / element（tag / class / id / scrollWidth）| |
| Likely source | Blogger toolbar / Blogger theme / project article / ad iframe / code block / table / long URL / image / unknown |
| Classification（§F-4）| P0 / P1 / P2 / external |
| Screenshot note | |

Issue 記錄格式建議：`[Pn] {Step} — {現象} — {建議修正方向}`。

---

## I. 下一步

- **若本 runbook 可用**：Phase 1 穩定測試流程可繼續（draft-preview 鏈路已文件化、可重複）。
- **B1 preview navigator 已 landed（2026-07-12）**：`check:blogger-preview`（read-only navigator）已納入 §C.5；操作前 / 中皆可用來確認 slug + `dist-blogger/posts/<slug>/` artifacts。詳 `docs/20260712-preview-only-helper-implementation.md`。
- **B2 draft-aware preview build 仍未實作 / Dean-gated**：`docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 之 draft-aware preview build（隔離輸出 `dist-blogger-preview/` + PREVIEW-ONLY 標記 + `.gitignore` 對齊）**尚未實作**；須另開獨立 phase + explicit approval。B1 不能取代 B2；本 runbook §D-4 workaround（暫改 status/draft 走 `build:blogger`）仍為 draft-preview 之唯一路徑，直到 B2 landed。
- **不做**：放寬 `build:blogger` 收 draft（inventory Option C）、任何 build / deploy / 動正式 dist / 動 `classify`。

### I-1. B1 vs B2 status（本 runbook 之定位）

| Helper | Status | 主要輸出 | Write side effect |
| --- | --- | --- | --- |
| B1 — Read-only navigator（`check:blogger-preview`）| ✅ implemented（`cc6497b`，2026-07-12）| inspect existing `dist-blogger/posts/<slug>/` artifacts + candidate/filtered listing | none |
| B2 — Draft-aware preview build | ⏸ not implemented / Dean-gated | possible `dist-blogger-preview/`（gitignored；PREVIEW-ONLY marker） | requires separate phase and explicit approval |

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script / preview-only script；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。§0 之 boot baseline 為 read-only 驗證；本檔所述步驟供 Dean 手動執行，**未宣稱任何 preview PASS**。

## See also

- `docs/20260712-preview-only-helper-implementation.md`（B1 navigator source slice landing ledger；2026-07-12；§C.5 之對應實作 + `check:blogger-preview-smoke` 49/49 契約）
- `docs/20260710-blogger-preview-only-script-preanalysis.md`（B1 navigator §6.1 / B2 draft-aware preview build §6.2 preanalysis；B2 仍 preanalysis-only）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點 + Option A/B/C 決策；本 runbook = 該 doc §9 之 S1）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（Blogger mobile 水平捲軸 audit；§5 debug checklist / Console snippet 已併入本 runbook §F —— 該 audit §7 之 Option A）
- `docs/20260708-phase1-second-manual-e2e-result.md`（§E P1-2 觸發本 runbook；§E P1-3 觸發 §F overflow debug；§D Attempt notes 之 raw-Markdown vs HTML 教訓）
- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（第二次 E2E 測試包 + 紀錄模板）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path）
- `src/scripts/load-posts.js`（`classify` 單一事實來源：`draft !== true` 且 `status ∈ {ready, published}`）、`src/scripts/build-blogger.js`（Blogger 渲染 / 輸出路徑）、`src/scripts/admin-markdown-export.js`（Admin 恆 draft 契約）
- `CLAUDE.md` §7（Blogger 發布 checklist）、§14/§15（tags / categories registry）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）
