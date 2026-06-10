# Blogger Repost — Commerce Affiliate Box Preflight (R4B, read-only)

> **Phase**: `20260610-pm-9-blogger-repost-preflight-commerce-affiliate-box-readonly-a`
> **Mode**: **read-only preflight**。確認 Blogger repost 前所需資訊 / 輸出檔 / CSS 狀態 / 人工步驟。**不**貼 Blogger、**不**改 Blogger、**不** deploy、**不**改 content / source / registry / config。
> **⚠️ 本 session 不授權 actual Blogger repost。** 真正重貼須**下一個 session** 並取得 **user explicit approval**。
> **Created**: 2026-06-10 +0800（14:21 起始）
> **Baseline**: main HEAD = origin/main = `75ec89b` / gh-pages HEAD = origin/gh-pages = `2acb5a5` / clean / normal 0/69/59 / overlay 0/72/60 / smoke 14/14 / GitHub Pages live acceptance = PASS。
> **References（read-only）**: `docs/20260610-github-pages-commerce-live-acceptance.md`（pm-8 live PASS）、`docs/20260610-commerce-affiliate-box-r4-deploy-preflight.md`（pm-5 §3.2 Blogger repost）、`docs/20260524-blogger-repost-checklist.md`（Blogger 後台重貼 SOP）、`docs/github-deploy.md`、`CLAUDE.md` §10 / §24。

---

## 1. Blogger output preflight result（本地 `npm run build:blogger`，未貼 Blogger）

| 檢查項 | 結果 |
| --- | --- |
| `dist-blogger/posts/we-media-myself2/post.html` 存在 | ✅ |
| affiliate box 數量 | **1**（body line 47 之後 box line 78 → **bottom-only，無 top box**）|
| href #1 | `https://whitehippo.net/3QaKr?uid1=blog`（exact，含 `uid1=blog`）|
| href #2 | `https://adcenter.conn.tw/3QaLi?uid1=blog`（exact，含 `uid1=blog`）|
| `href="undefined"` / `href=""` / ref-as-href | **0** |
| internalLabel leak | **0** |
| KOBO 金石堂電子書 excluded（`book-rouhou-time-kingstone-ebook-books` / `shoppingfun.co/3QWMC`）出現於 output | **0** |
| 連結文字 | 「博客來：實體書 通路王」/「金石堂：實體書 通路王」（rel `sponsored nofollow noopener noreferrer` + `target="_blank"`）|

**配套產物**（同 `dist-blogger/posts/we-media-myself2/`）：`copy-helper.txt`（標題 / 搜尋說明 / 標籤）、`meta.json`、`publish-checklist.txt`（單篇發布勾選）。

→ Blogger output **preflight PASS**；`post.html` 內容與 GitHub Pages 端 live-accepted 之 affiliate box 一致。

---

## 2. CSS / Blogger theme preflight result

**問題：Blogger repost 是否只需貼 `post.html`，還是須 Blogger 後台 theme 已含 `.lab-affiliate-box` 樣式？**

| 事實 | 值 |
| --- | --- |
| `post.html` 含 affiliate box markup（`.lab-affiliate-box` BEM）| ✅ |
| `.lab-affiliate-box` 樣式存在於 theme bundle `dist-blogger/theme/blogger-full-style.css` | ✅（8 rules；亦在 `blogger-components.css`）|
| `.lab-affiliate-box` 樣式 source | `src/styles/blogger/_blogger-components-rules.scss`（+ `src/styles/components/_affiliate-box.scss`）|
| 該 CSS 自何時存在於 source bundle | **2026-05-06**（commit `0bf59cc`，Phase 0–3 初始化）—— 遠早於 gh-pages `960f234` deploy 時期 |
| **Blogger 後台（live theme）目前是否含 `.lab-affiliate-box`** | ❓ **UNKNOWN / 無法從 repo 驗證**（Blogger 後台為外部狀態；`docs/20260524-blogger-repost-checklist.md` §0 記錄 theme CSS 自 `960f234` 後**未重貼**，但不代表更早之 repost 是否已含此 rule）|

**判斷（不修改 CSS，僅文件化）**：

- **僅貼 `post.html` 是否足夠？** —— **取決於 Blogger 後台 theme CSS 是否已含 `.lab-affiliate-box`**。
  - 若**已含** → 只需貼 `post.html`，box 會正常**有樣式**渲染。
  - 若**未含** → box 仍會渲染但**無樣式**（退化為樸素 `<aside>` + `<h3>立即購買</h3>` + `<ul><li><a>`）；**連結仍可點、href 仍正確含 uid1=blog**（功能不受影響，僅缺視覺框線 / 間距 / 背景）。此時建議**一併重貼** theme CSS bundle `dist-blogger/theme/blogger-full-style.css`（per checklist §3）。
- **本 preflight 無法代為確認 Blogger 後台 CSS 狀態** → 列為 §3 之 user 必須確認項。
- ⚠️ 紅線：**本 phase 不修改任何 CSS、不貼 Blogger**；theme CSS 是否重貼為 user 決策。

---

## 3. Required manual inputs for actual repost（正式 R4B 前 user 須提供 / 確認）

| # | 項目 | 說明 / 現況 |
| --- | --- | --- |
| 1 | **Blogger published URL（目標文章網址）** | we-media-myself2 之 Blogger 文章正式 URL。⚠️ **frontmatter 無 `blogger.publishedUrl`**；現 `relatedLinks` 指向 `https://babel-lab.blogspot.com/2026/04/we-media-myself.html`（= **#1 文「we-media-myself」，非本 #2 文**）→ **目標 URL 須 user 明確提供**。|
| 2 | **Blogger 後台文章 ID / title** | user 須指認後台中對應「自媒自創 #2（提問筆記書）」之文章（編輯入口），避免貼錯文章。|
| 3 | **是否先備份目前 Blogger HTML** | **強烈建議**（per checklist §2.2）：重貼前先複製後台現有 HTML 存檔（`D:\github\blog-new\backup\blogger-post-html-we-media-myself2-YYYYMMDD.txt`），供回滾。|
| 4 | **Blogger 後台 theme 是否已含 `.lab-affiliate-box` CSS** | user 須於 Blogger 後台主題 CSS 搜尋 `lab-affiliate-box` 確認。若無 → 須一併重貼 `dist-blogger/theme/blogger-full-style.css`（先備份現有 theme CSS，per checklist §2.1）。|
| 5 | **是否接受此次 Blogger 文章新增「通路王區塊」** | 本次重貼會在 Blogger 文章底部新增 2 個聯盟連結（通路王）。user 須確認接受此內容變更（含聯盟揭露 disclosure 已在區塊內）。|
| 6 | **repost 後要驗收的項目** | 見 §4。|

---

## 4. Post-repost acceptance items（正式重貼後 user 驗收；本 phase 僅列出）

- Blogger 文章底部出現**且只有 1 個**「立即購買」通路王區塊（bottom），**無 top box**。
- 2 個連結文字 =「博客來：實體書 通路王」/「金石堂：實體書 通路王」。
- 點擊 → 跳轉 affiliate redirect，網址列含 `uid1=blog`（`whitehippo.net/3QaKr` / `adcenter.conn.tw/3QaLi`）。
- 連結新分頁開啟（`target="_blank"`）、`rel` 含 `sponsored nofollow noopener`。
- 無 `href="undefined"` / `href=""` / 破連結；無 internalLabel 顯示。
- box 有樣式（若 theme CSS 已含 `.lab-affiliate-box`）；若無樣式 → 回頭處理 §3#4（重貼 theme CSS）。
- 桌機 / 手機版面正常；AdSense / 其他區塊未破版。
- （可選）GA4 Realtime 觀察 `click_affiliate_cta`（屬 SOP，非阻擋）。
- 異常 → 依 checklist §6 回滾（貼回 §3#3 備份 HTML）。

---

## 5. Mutation scope / 紅線（本 phase）

- ✅ 僅新增本 preflight docs file。
- ❌ 零 content / src / `site.config.json` / package / lockfile / registry / dist / dist-blogger / .cache / gh-pages / deploy branch 變更。
- ❌ 未貼 Blogger / 未改 Blogger / 未改 CSS / 未 deploy / 未動 GA4 / reverse UTM / KOBO excluded entry。
- （build:blogger 產出 `dist-blogger/` 為 gitignored，僅用於檢查，git status clean。）

---

## 6. Suggested next safe phase（**不自動啟動**；須 user explicit approval）

**R4B actual Blogger repost**（另開 session）：
1. user 提供 §3 必填項（目標 Blogger URL / 文章 ID、theme CSS 狀態、接受新增通路王區塊）。
2. 備份現有 Blogger post HTML（+ 必要時 theme CSS）。
3. 貼 `dist-blogger/posts/we-media-myself2/post.html`（必要時併 `blogger-full-style.css`）→ 預覽 → 更新。
4. §4 驗收；異常依 checklist §6 回滾。

---

*（本文件結束 — R4B Blogger repost read-only preflight；Blogger output PASS（1 bottom box，2 href = registry targetUrl exact 含 uid1=blog，0 leak，KOBO 0）；CSS = `.lab-affiliate-box` 存在於 source bundle 自 2026-05-06，但 Blogger 後台 live theme 狀態 UNKNOWN 須 user 確認；列出正式重貼前 6 項 user 必填 / 確認；**本 session 不授權 / 不執行 repost**；docs-only，無 Blogger / content / source / registry / config 變更。）*
