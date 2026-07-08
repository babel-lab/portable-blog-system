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

## D. 操作流程

> ⚠️ 全程界線：只到 Blogger **draft / preview**；不發布、不 deploy、不 commit 測試文章。

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

7. **複製 HTML 到 Blogger HTML 模式。**
   從 `dist-blogger/posts/<slug>/post.html`（或 `copy-helper.txt`）複製 **HTML** 內容（不是 raw Markdown），在 Blogger 後台**切到 HTML 檢視模式**再貼上（不要貼進 Compose / 純文字模式，否則會顯示未渲染的 `##` / `[text](url)`；見 §E）。

8. **Blogger 只儲存草稿與 Preview，不發布。**
   用 Blogger 的**儲存草稿 / 預覽**看外觀（標題、段落、圖片、連結、CTA、廣告位置、RWD 桌機 + 手機）。**不要按發布。**

9. **檢查渲染是否正確。**
   確認 raw Markdown 語法**已消失**（沒有可見的 `##` / `[text](url)`），且 `h2` / `p` / `ul` / `a` / `blockquote` / `code` 等元素在 Blogger 預覽中**正常渲染**。若仍看到 raw Markdown → 代表貼成純文字或貼到 Markdown 而非 HTML，回 §D-7 重貼。

10. **改回 draft。**
    把 §D-4 的暫改**還原**：`status` 改回 `"draft"`、`draft` 改回 `true`（或直接於 §D-11 移除整個測試檔）。目的：避免測試檔在下次正式 `build:blogger` / deploy 被當成 ready 輸出（§F 最實際的隱患）。

11. **檢查 console / 404 / broken image，然後清理。**
    - 在 Blogger preview（及必要時 GitHub Pages readonly）用 DevTools 檢查 console error / 404 / broken image，記入 §G。
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
- **Blogger mobile preview 出現水平捲軸**：先記 **P1 待確認**，**不**直接判 P0（來源可能是 Blogger 預覽工具列 / Blogger 模板 / 廣告區 / code 版面，需 follow-up 驗證再定性）。
- **Chrome extension `contentscript.js` warning**：通常**不算專案 P0**（研判為瀏覽器擴充套件相關，非本專案輸出）。

---

## F. 不可做事項

- ❌ **不要 commit 測試文章**（測試檔與 `dist-blogger/` 輸出皆一次性、測完清理）。
- ❌ **不要發布 Blogger**（僅到 draft / preview）。
- ❌ **不要 deploy GitHub Pages**（不碰 deploy clone、不 push gh-pages）。
- ❌ **不要把 `build:blogger` 改成輸出 draft**（放寬 = 違反 CLAUDE.md §23；見 inventory §6.2）。
- ❌ **不要用假 cover URL 做正式文章**（假 cover 僅限本機一次性預覽，且需為有效 URL）。
- ❌ **不要把 Preview workaround 當正式 publish 流程**（跑完 runbook ≠ 已發布）。

---

## G. 結果紀錄模板

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

Issue 記錄格式建議：`[Pn] {Step} — {現象} — {建議修正方向}`。

---

## H. 下一步

- **若本 runbook 可用**：Phase 1 穩定測試流程可繼續（draft-preview 鏈路已文件化、可重複）。
- **若仍常常需要 preview draft**：未來可**獨立評估** preview-only export script（inventory §7 Option B：輸出到獨立、永不 deploy、gitignored 的 `dist-blogger-preview/`，含 PREVIEW-ONLY 標記），**但不是本 session**——須另開獨立 phase + explicit approval 才實作。
- **不做**：放寬 `build:blogger` 收 draft（inventory Option C）、任何 build / deploy / 動正式 dist / 動 `classify`。

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script / preview-only script；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。§0 之 boot baseline 為 read-only 驗證；本檔所述步驟供 Dean 手動執行，**未宣稱任何 preview PASS**。

## See also

- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點 + Option A/B/C 決策；本 runbook = 該 doc §9 之 S1）
- `docs/20260708-phase1-second-manual-e2e-result.md`（§E P1-2 觸發本 runbook；§D Attempt notes 之 raw-Markdown vs HTML 教訓）
- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（第二次 E2E 測試包 + 紀錄模板）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path）
- `src/scripts/load-posts.js`（`classify` 單一事實來源：`draft !== true` 且 `status ∈ {ready, published}`）、`src/scripts/build-blogger.js`（Blogger 渲染 / 輸出路徑）、`src/scripts/admin-markdown-export.js`（Admin 恆 draft 契約）
- `CLAUDE.md` §7（Blogger 發布 checklist）、§14/§15（tags / categories registry）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）
