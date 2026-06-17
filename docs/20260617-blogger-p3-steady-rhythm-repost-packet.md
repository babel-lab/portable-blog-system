# Blogger P3 `blog-restart-steady-rhythm-notes` — Manual repost packet（docs-only）

> Phase: `20260617-am-blogger-p3-steady-rhythm-repost-packet-docs-only-a`
> Date: 2026-06-17
> Type: docs-only repost packet（**不**登入 / 操作 Blogger；**不** repost；**不** deploy；**不** rebuild；**不**改 source·settings·content；**不** commit generated output）。唯一 mutation = 本 doc + CLAUDE.md 極小 pointer sync。
> Scope: 為 P3 準備手動重貼操作包，讓 Dean 之後可照 packet 操作或另開 execution phase。實際 repost 一律須 Dean explicit approval + backup，另開獨立 execution phase。

> ⚠️ 本文件**不含** real AdSense client / slot id；一律以 slot key `articleAd6` / anchor key `beforeRelatedLinks` 表述。real id 僅存於 `content/settings/ads.config.json`（亦只出現在 gitignored generated output）。

---

## 0. Baseline anchor

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `c105880` |
| origin/main | `c105880` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(blogger): record p3 generated html verification` |

→ 完全符合 expected。未 pull / reset / checkout / merge / rebase。

---

## 1. Target post

| 欄位 | 值 |
|---|---|
| id | `20260612-blog-restart-steady-rhythm-notes` |
| slug | `blog-restart-steady-rhythm-notes` |
| title（核准） | 個人部落格重啟筆記：先求穩定，再求流量 |
| source file | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` |
| generated HTML | `dist-blogger/posts/blog-restart-steady-rhythm-notes/post.html`（full；gitignored） |
| generated sidecar | 同目錄 `copy-helper.txt` / `publish-checklist.txt` / `meta.json`（gitignored） |
| contentKind / mode | life-note / Blogger full |
| 搜尋說明（[3]） | 個人部落格重啟筆記：與其一開始追流量、排程、變現，不如先把寫作與整理流程變簡單、建立願意穩定回來的節奏；先求穩定，再求流量。 |
| 標籤（[4]） | `self-growth` |

> ⚠️ generated HTML / copy-helper / publish-checklist 為 gitignored 即時產物；若 `dist-blogger/` 已清空，repost 前須先**重新** `build:blogger`（另階段；本 packet 不執行）。

---

## 2. Pre-repost readiness（已驗證）

| 項目 | 狀態 | 來源 |
|---|---|---|
| content landing | ✅ commit `57d9491` | `content(blogger): land steady rhythm restart note` |
| generated HTML verification record | ✅ commit `c105880` | `docs/20260617-blogger-p3-generated-html-verification-record.md` |
| `check:blogger-adsense-output` | ✅ **85 / 0**（6 live targets no-regression） | 前一 verification phase |
| EJS raw leak（`<%`/`%>`/`<%-`/`<%=`） | ✅ **0** | 前一 verification phase |
| `articleAd6` slot 出現次數 | ✅ **恰 1 次**（body 後 / hashtags 前） | 前一 verification phase |
| `validate:content` | ✅ 0 error（landing phase 0/94/84；production-post warnings 0） | landing phase |

→ pre-repost readiness：**ready**（技術面）。唯 live repost 須 Dean approval + 新文章/覆蓋決策 + 備份。

---

## 3. Manual repost steps（Dean 操作；本輪不執行）

1. **（若 dist 已清）重新 build**：另開 build phase 跑 `npm run build:blogger`，確認 P3 `post.html` 存在且為 full mode。
2. **Blogger 後台**：開「新文章」（若 P3 為全新發布）或開「指定既有文章」（若覆蓋——須先做 §4 備份）。
3. **切到 HTML 模式**（不是「撰寫」視覺模式）。
4. **貼上 generated HTML**：複製 `dist-blogger/posts/blog-restart-steady-rhythm-notes/post.html` 全文貼入（已包覆 `.lab-blogger-article` wrapper）。
5. **標題**：使用核准 title「個人部落格重啟筆記：先求穩定，再求流量」（copy-helper [1]）。
6. **自訂網址 / Permalink**：`blog-restart-steady-rhythm-notes`（copy-helper [2]）。
7. **搜尋說明**：貼 copy-helper [3]。
8. **標籤**：`self-growth`（copy-helper [4]）。
9. **儲存草稿 → 預覽**（桌機 + 手機）。
10. **發布前檢查**：對照 §6 post-repost verification 與 generated `publish-checklist.txt`。
11. **發布後**：回填 §5 記錄；依 copy-helper [6] 將 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` 補回 source frontmatter（屬另階段 content edit，須 approval）。

---

## 4. Backup plan

- **若覆蓋既有 Blogger 文章**：
  - 重貼前先在 Blogger 後台切 HTML 模式，**完整複製原文章 HTML 另存備份**（建議存檔名含日期 + 原 post id），確保可回退。
  - 記下原文章的 published URL / post id，避免覆蓋後失聯。
- **若為全新文章**：
  - 發布後立即記錄 Blogger **post URL** / **post id** / **published timestamp**，供回填 frontmatter（copy-helper [6]）與未來站內互連引用。
- 任一情況：未經備份/記錄前，不要按「發布」。

---

## 5. Repost 記錄欄位（Dean 回填）

| 欄位 | 值（待回填） |
|---|---|
| repost 模式 | ☐ 全新文章　☐ 覆蓋既有文章（覆蓋須先備份） |
| 原文章 HTML 備份位置（若覆蓋） | `__________` |
| Blogger live URL | `__________`（待 Dean 回填） |
| Blogger post id | `__________` |
| published timestamp | `__________` |

---

## 6. Post-repost verification checklist（Dean 重貼後目視）

| 檢查項 | 期望 |
|---|---|
| live URL | 待 Dean 回填（§5） |
| full content visible | 引言 + 6 個 H2 全可見、無截斷 |
| no EJS leak | 前台**不可**出現 `<%` / `%>` / `<%-` / `<%=` 等字面 |
| articleAd6 區塊位置 | 存在於 **body 後 / hashtags 前**（anchor `beforeRelatedLinks`） |
| hashtags `#self-growth` | 文末可見 |
| no visible broken layout | 段落 / 標題 / 廣告框 / hashtag 無破版 |
| AdSense fill | **blank / unfilled 不視為 insertion failure** |

**insertion vs ad fill 區分（重要）**：
- **insertion 成功** = HTML 裡 `articleAd6` 的 `<ins class="adsbygoogle ...">` + push script 有正確貼上（這是本系統可保證、且已於 generated HTML 驗證的部分）。
- **ad fill** = Google 實際是否回填一支廣告，受 AdSense 帳戶狀態 / 政策 / 流量 / 地區 / 時段影響，**非本系統可控**；空白 / 未填屬正常變動，**不等於**重貼失敗。
- 判定原則：只要 `<ins>` 標籤與 push script 存在且未破版 → insertion PASS；ad 是否 filled 另以 AdSense 後台 / 多次觀察為準。

---

## 7. Theme CSS readiness

- generated HTML 使用 `.lab-blogger-article` / `.lab-article__*` / `.lab-ad-slot--articleAd6` / `.lab-hashtags` 等 class，**依賴 Blogger 後台 theme 已貼對應 CSS**（`dist-blogger/theme/blogger-full-style.css`，建議一次性貼入 Blogger 主題）。
- **若樣式未套用（版面看起來無 CSS / 純文字堆疊）**：先判定是 **theme CSS 問題**，非 generated HTML 問題——依據：
  - generated HTML 結構已於 `c105880` 驗證正確（class 名稱、巢狀、區塊齊全）；
  - 內容文字 / 連結 / 廣告 `<ins>` 仍存在且可運作，只是缺視覺樣式 → 典型為 theme 層未貼 CSS；
  - 修法 = 於 Blogger 後台主題貼上 `blogger-full-style.css`（另階段；本 packet 不執行 build/貼 CSS）。
- 反之，若**結構**缺漏（段落消失 / 廣告 `<ins>` 不見 / wrapper 破損）才需回頭看 generated HTML —— 但目前驗證顯示結構完整，故預期問題若有多落在 theme CSS 層。

---

## 8. GA4 / canonical / UTM 注意事項

- **canonical cross-platform**：generated HTML body 內 `<link rel="canonical">` 指向 GitHub Pages，且已含 blogger→github UTM（`utm_source=blogger` / `utm_medium=internal_referral` / `utm_campaign=blogger_to_github` / `utm_content=blog-restart-steady-rhythm-notes`）——已於 generated HTML 驗證（`c105880`）確認。
- Blogger 主題 head 之 canonical 通常另指向 Blogger 平台 URL（與 body 內輔助 canonical 不同），屬已知設計（copy-helper [10]）。
- **GA4 live 行為確認**（事件是否實際上報、跨站導流是否如預期）→ **另開後續 observation phase**；本 packet 不做 GA4 live 驗證。

---

## 9. Execution gate

- 實際 repost **必須 Dean explicit approval**。
- repost 前**必須確認**：☐ 全新文章　還是　☐ 覆蓋既有文章（覆蓋須先完成 §4 備份）。
- **repost execution 另開獨立 phase**（per 既有 SOP：`docs/20260524-blogger-repost-checklist.md` / `docs/20260524-blogger-github-publishing-runbook.md`）。
- 本 packet **不**代表 approval；Claude 本輪**不**登入 / 操作 Blogger、**不** repost。

---

## 10. Non-actions（本 phase 明確不做）

- ❌ 不登入 / 操作 Blogger、不 repost、不貼任何內容到 Blogger
- ❌ no deploy / no push gh-pages
- ❌ no rebuild（未跑 build:blogger / validate:content / check guards；§2 數值 carry-forward）
- ❌ no source / settings / content change（含 P3 文章、Blogger templates、AdSense / GA4 / commerce / Admin source）
- ❌ no generated output committed（`dist-blogger/*` gitignored）
- ❌ no npm install / no merge / rebase / reset / amend / force push
- ❌ CLAUDE.md 不壓縮 / 不重排（僅極小 pointer sync）
- ❌ 不自行開下一個 phase
- ❌ 不把 Blogger VIEW count / AdSense fill 詮釋為真實流量 / earning / policy approval

---

## 11. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify | ✅ `main` / `c105880` / 0/0 / clean |
| 唯一 file change | `docs/20260617-blogger-p3-steady-rhythm-repost-packet.md`（新增）+ CLAUDE.md 極小 pointer sync |
| 未登入 / 操作 Blogger / 未 repost | ✅ |
| 未 deploy / rebuild / npm install | ✅ |
| 未改 source / settings / content / P3 文章 | ✅ |
| 未 commit generated output | ✅ |
| 未暴露 real AdSense id | ✅（僅 slot key `articleAd6`） |
| 未自行開下一 phase | ✅ |

→ docs-only packet，read-only acceptance trivially PASS。

---

（本文件結束）
