# 2026-05-29 Reverse UTM Download fileUrl Decision Preanalysis

Phase: `20260529-pm-10-reverse-utm-download-fileurl-decision-report-docs-only-a`
Date: 2026-05-29 14:57 +0800
Scope: docs-only（唯一新增檔；本檔即本 phase 全部 artifact）

本檔將 phase `20260529-pm-9-reverse-utm-download-fileurl-decision-preanalysis-readonly-a` 之 read-only fileUrl decision preanalysis 結論固化落地，供未來 cold-start session / promote 決策直接讀取，避免重新盤點。

對應上層文件：
- `CLAUDE.md` §13（download 規則；`download.enabled: true` 但無 `fileUrl` 應警告）
- `CLAUDE.md` §22（圖片 / 素材不由系統自動上傳；大型原始檔不建議放 public repo；可放專案外 `D:/BlogAssets/`）
- `CLAUDE.md` §16.4（Blogger → GitHub reverse UTM；source landed but dormant）／§23（draft 不輸出）
- `docs/20260529-reverse-utm-fixture-publish-readiness-preanalysis.md`（pm-8 publish-readiness report）
- `docs/20260529-reverse-utm-deploy-gate-readiness-triage.md`（pm-6 gate triage）

---

## 1. Executive Summary

- pm-9 為 **read-only fileUrl decision preanalysis**（純分析；零修改）；本檔（pm-10）為其結論之 docs-only landing。
- Blogger draft fixture（`content/blogger/posts/20260529-phonics-practice-sheet-download.md`）仍卡在 **`download.fileUrl` 空值（`""`）**。
- **不得假造 fileUrl**。
- **user 尚未提供真實 PDF URL 前，fixture 應維持 draft**。
- **reverse UTM remains landed but dormant**。
- **pm-26 deploy gate remains BLOCKED**。
- **不推薦直接 promote-to-ready / deploy / Blogger repost / GA4 validation / unblock**。

---

## 2. Baseline（2026-05-29 14:57 +0800）

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `025ef9b777a28d8fa634a71b5af72e67bbbbe117`（short `025ef9b`）|
| origin/main | `025ef9b777a28d8fa634a71b5af72e67bbbbe117` |
| latest commit subject | `docs(reverse-utm): record fixture publish readiness preanalysis` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`）|
| validate:content | `0 error(s) / 42 warning(s) on 37 post(s)` |

→ baseline 完全對齊 pm-9 啟動時之狀態。42 warnings 全屬 `content/validation-fixtures/`（validator 錯誤樣本，by design）。

---

## 3. Evidence Sources

本分析依據以下檔案（皆 read-only 檢視；本 phase 僅新增本 docs 檔，未改下列任一）：

| 檔案 | 重點 |
|---|---|
| `docs/20260529-reverse-utm-fixture-publish-readiness-preanalysis.md` | pm-8：fixture NOT ready；hard blocker = 空 fileUrl |
| `docs/20260529-reverse-utm-deploy-gate-readiness-triage.md` | pm-6：pm-26 gate BLOCKED；reverse UTM dormant |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | draft fixture；`download.fileUrl: ""`；body 自承「下載檔尚未上傳」|
| `content/templates/blogger-download-template.md` | template 預設亦 `fileUrl: ""`（佔位空字串；非真實 URL）|
| `src/views/blogger/blogger-post-full.ejs` | download box 條件 `enabled && fileUrl`（line 81）；render 僅 `href="<%= fileUrl %>" download`（line 89）|
| `src/scripts/build-blogger.js` | `download: post.download ?? null`（line 452）純透傳；無 warning |
| `src/scripts/validate-content.js` | 無任何 `fileUrl` 檢查 |
| repo `download.fileUrl` 範例掃描 | grep 全 repo 僅 2 處 `fileUrl`（fixture + template），**兩者皆空字串 `""`**；**無任何已填真實 fileUrl 範例**可參照格式 |

---

## 4. Current Blocker

- `download.fileUrl: ""`（空字串）。
- `validate:content` **不會擋**（無 fileUrl 檢查；0 errors 維持）。
- `build` / renderer **不會警告**（build-blogger 純透傳；§13「build 時應警告」為規格期望但尚未實作）。
- `blogger-post-full.ejs` 因 `fileUrl` falsy（`""`）而 **不輸出 download box**（line 81 條件 `post.download.enabled && post.download.fileUrl`）。
- ready 後會形成「**下載文沒有下載按鈕**」——`contentKind: download` 且標題即「…下載」的文章，渲染後無下載入口。
- 因此：**取得真實 fileUrl 是 promote-to-ready 前置 gate（hard gate）**。

---

## 5. fileUrl Options Comparison

### Option A: Blogger-hosted file URL
- 優點：檔案 host 在外部平台，**不納 repo 二進位**（符合 `CLAUDE.md` §22）；與 Blogger 發布流程同源。
- 缺點：Blogger 對「檔案直連下載」支援弱（偏圖片/附件），不易取得穩定 direct-download URL。
- 是否適合長期使用：🟡 中（綁 Blogger 平台）。
- 是否容易取得穩定 URL：🔴 較難（Blogger 非檔案託管平台）。
- 風險：中（URL 形式不穩定；`download` 屬性跨網域被忽略）。
- 推薦度：🟡 次佳（符合不納 repo，但直連能力弱）。

### Option B: Google Drive public share URL
- 優點：取得容易；容量大；user 常用。
- 缺點：一般 share URL（`/file/d/<id>/view?usp=sharing`）開的是**預覽頁**而非直接下載；須改為 `uc?export=download&id=<id>` 才直連，大檔仍可能跳病毒掃描攔截頁。
- 預覽頁 / 權限 / 非直連風險：🔴 高——權限易誤設 private；連結易因 Drive 政策變動失效；點擊體驗非「直接下載」。
- 是否適合填入 fileUrl：🟡 僅在轉成 direct-download 格式並驗證公開權限後。
- 推薦度：🔴 不推薦（除非明確轉 direct-download URL 並人工驗證）。

### Option C: GitHub Pages / repo public asset URL
- 優點：同源直連、路徑即直連 URL、`download` 屬性可生效；版本化、git 管理、隨站搬家。
- 缺點：須把 PDF 放進 `public/downloads/` → build 進 `dist/` → deploy 至 gh-pages。
- 是否需把 PDF 納入 repo / public / deploy 流程：✅ 是。
- 二進位檔納管風險：🟡 二進位進 git 史（不可瘦身、repo 膨脹）；`CLAUDE.md` §22 明示「大型原始檔不建議放 public repo」「可放專案外 `D:/BlogAssets/`」→ 適合**小型 PDF**；大型素材不宜。
- 是否影響 GitHub Pages deploy：✅ 會（deploy 體積與頻寬納管）。
- 推薦度：🟢 技術最穩定（須權衡 §22 二進位納管成本）。

### Option D: External cloud / CDN URL
- 優點：可取得高效直連；不納 repo。
- 缺點：服務分散；URL 穩定性與權限視服務而定；無統一管理。
- 長期可維護性：🔴 低（多服務分散、難追蹤失效）。
- 推薦度：🔴 不推薦。

### Option E: Keep draft until real URL exists
- 為何是目前最安全狀態：fixture 維持 draft → 不輸出（`CLAUDE.md` §23）→ 不產 post.html → reverse UTM dormant → 零 production 風險；無需假造任何 URL。
- 何時可前進：待 user 提供真實、可公開存取、穩定的 PDF/download URL 後，另開 content-mutation phase。
- 推薦度：🟢 **user 未給 URL 前最安全**。

---

## 6. Repo / Template Behavior

- `download.fileUrl` 目前僅作為 `<a href>` 填入值，**template 不做 URL 可達性驗證**（`blogger-post-full.ejs:89` `href="<%= post.download.fileUrl %>" download`）。
- **Google Drive share URL 可能只是預覽頁，不一定是直接下載**（須轉 `uc?export=download` 格式）。
- **GitHub Pages URL 若用於 PDF，可能需把 PDF 放進 `public` / `dist` 並納入 deploy 管理**。
- **Blogger / Drive 可避免 repo 納管二進位檔**，但**權限與連結穩定性須人工確認**。
- **`validate:content` / `build` / `check-broken-links` 目前皆不檢查 fileUrl 可達性**（`check-broken-links` 明示「External http(s) links are not actually fetched」且未掃 `download.fileUrl`）。
- 因此 **fileUrl 必須作為人工 gate**（無任何自動工具會攔截壞 URL / 空 URL）。

---

## 7. Recommended Strategy

- **最安全策略**：維持 draft，等待 user 提供真實 PDF URL。
- **推薦優先方案**：由 **user 先決定 PDF 放置位置**，取得**可公開存取的穩定 URL**。
- 若使用 **Google Drive**：需確認公開權限與點擊體驗（轉 direct-download 格式，避免預覽頁）。
- 若使用 **GitHub Pages**：需先接受 **PDF 納入 repo / deploy 管理的成本**（小型 PDF 較合適；大型素材按 §22 不宜入 public repo）。
- ⛔ **不推薦假造 URL**。
- ⛔ **不推薦在 fileUrl 空值狀態 promote-to-ready**。
- ⛔ **不推薦直接 deploy / Blogger repost / GA4 / unblock**。

---

## 8. Future Phase Plan

> 後續最小安全路線；每段獨立 user explicit approval；本 docs-only phase 皆不執行。

### Phase C2: User prepares real PDF URL
- user 提供真實 PDF / download URL。
- **Claude 不自行假造 URL**。

### Phase D: content mutation — fill fileUrl + promote-to-ready
- 需 **user explicit approval**。
- 修改 `download.fileUrl`。
- `status: draft → ready`。
- `draft: true → false`。
- 移除草稿 / 待定稿 / 未完成語句（fixture body line 53 / 57 / 65）。
- 可選補 `cover` / `coverAlt`。

### Phase E: build:blogger output verification
- build 後驗證 post.html。
- 檢查 download box 是否存在。
- 檢查 reverse UTM 4 keys（`utm_source=blogger` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links`）。
- 檢查 `target="_blank"` / `rel` token 合併 / 非 GitHub links 不誤注入 / legacy summary CTA 不變。

### Phase F: deploy / Blogger repost / GA4 validation
- 最後 activation sequence。
- 需獨立 user explicit approval。
- 完成後始解除 pm-26 gate unblock。

---

## 9. Candidate Next Steps

> 任一候選之啟動皆須**獨立 phase + 該次 phase 之 user explicit approval**；本檔之列舉**不**等同任一段之預授權。

- **Candidate A: Final Idle Freeze / EXIT** —— 本階段結束，不開下一 phase。🟢 安全；不解除 gate。
- **Candidate C: wait for user-provided real PDF URL** —— 等 user 先提供真實 PDF / download URL。🟢 promote 真正前置；不解除 gate。
- **Candidate D: content mutation to fill fileUrl and promote-to-ready** —— 需 user explicit approval。🔴 本階段不得執行；單步仍不解 gate。
- **Candidate E: build / output verification** —— D 後才做。🔴 本階段不得執行。
- **Candidate F: deploy / Blogger repost / GA4 validation** —— 最後 activation 才做。🔴 本階段不得執行；完成後始解除 pm-26 gate。

⛔ 明確不推薦：直接 promote-to-ready、直接 deploy、直接 Blogger repost、直接 GA4 validation、直接 unblock pm-26 gate、假造 fileUrl。

---

## 10. Explicit Non-Actions（本 docs-only phase 未做）

| # | 未執行 |
|---|---|
| 1 | ❌ no content changes（既有 37 posts / draft fixture / GitHub reuse target 全不動）|
| 2 | ❌ no source changes（`src/**` 不動）|
| 3 | ❌ no settings changes（`content/settings/**` 不動）|
| 4 | ❌ no templates changes（`content/templates/**` 不動）|
| 5 | ❌ no package changes（無 npm install）|
| 6 | ❌ no dist / gh-pages / .cache changes |
| 7 | ❌ no build / deploy |
| 8 | ❌ no Blogger repost |
| 9 | ❌ no GA4 validation |
| 10 | ❌ no reverse UTM activation（remains landed but dormant）|
| 11 | ❌ no pm-26 deploy gate unblock（remains BLOCKED）|
| 12 | ❌ no draft-to-ready change（fixture 維持 draft）|
| 13 | ❌ no download.fileUrl fill（維持空值）|
| 14 | ❌ no fake URL（不假造任何 fileUrl）|
| 15 | ❌ no admin-write-cli dry-run / apply |
| 16 | ❌ no Admin Apply enable / no middleware write route |

本檔落地後 production state drift = 0；屬純 docs entry。

---

（本文件結束）
