# Footer 揭露最小 Source Landing 紀錄（Q1 Option B）

> 文件名稱：**Footer Disclosure Source Landing Record**
> 日期：**2026-06-26**
> 對象專案：`D:\github\blog-new\portable-blog-system`（portable-blog-system，第一版 MVP）
> 性質：**source landing 紀錄**。本階段把 footer disclosure links 從「設定觀察」落地為 GitHub Pages 實際渲染，並同步補上 `/privacy/`、`/affiliate-disclosure/` 兩頁，避免 dead link。
> 對應決策：上一階段 preflight 之 **Q1 Footer disclosure links → Option B（source landing）**；IA / 文案語氣依 `docs/20260626-footer-disclosure-ia-copy-lock.md`（§4–§8）。

---

## 1. Baseline（landing 前）

| 項目 | 狀態 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `ab2897c`（`docs(footer): lock disclosure ia copy`） |
| working tree | clean |
| origin/main | synced（ahead/behind 0/0） |
| `.git/index.lock` | absent |

---

## 2. 本階段目標

1. 讓 GitHub Pages 端 footer 能渲染 `footer.config.json` 的 disclosure links（隱私權政策 / 聯盟揭露）。
2. 補上 `/privacy/` 與 `/affiliate-disclosure/` 兩個靜態頁，避免 footer 成 dead link（review P2）。
3. 文案採「簡潔揭露型」，非正式法律條款、非法律意見。

「渲染 links」與「對應頁存在」於**同一階段同一 commit** 完成（IA lock §4.3 MUST），避免中間態 dead link。

---

## 3. 實際碰到的檔案

| 檔案 | 變更類型 | 說明 |
| --- | --- | --- |
| `src/views/layout/footer.ejs` | 修改 | 新增 disclosure links 渲染（讀繼承自 base.ejs locals 的 `footer` + `basePath`）；防禦式 guard，links 缺失時不輸出空殼、不 crash。僅 additive，未改既有 copyright 文字與 class naming。 |
| `src/scripts/build-github.js` | 修改 | (a) baseData 注入 `footer: settings.footer`；(b) 新增 `buildSeoForStaticPage`（robots `index, follow` + 站內 canonical）；(c) 新增 `/privacy/`、`/affiliate-disclosure/` 兩 route。 |
| `src/scripts/build-sitemap.js` | 修改 | sitemap `buildEntries` 末段顯式加入兩揭露頁 loc。 |
| `src/views/pages/privacy.ejs` | 新增 | 隱私權政策頁（簡潔揭露型內容）。 |
| `src/views/pages/affiliate-disclosure.ejs` | 新增 | 聯盟揭露頁（簡潔揭露型內容）。 |
| `docs/20260626-footer-disclosure-source-landing-record.md` | 新增 | 本紀錄。 |

設計取捨：

- **footer 資料傳遞**：沿用 repo 既有 EJS include 繼承機制（header.ejs 未被 base.ejs 顯式傳 `basePath`，仍能取用）→ 只需 baseData 注入 `footer`，**不需修改 `base.ejs`**。
- **靜態頁機制**：repo 無 content-driven page 機制；沿用 404 / design-system 之 template + build route 慣例（`src/views/pages/*.ejs` + build-github `renderPage`）。
- **連結處理**：揭露頁 footer link 為站內連結，依 §16.3 不加 `nofollow`、不加 UTM、同分頁（無 `target="_blank"`）；href 以 `<%= basePath %>` 前綴對齊 nav/header 慣例。

---

## 4. Metadata / policy（兩頁一致）

| 維度 | 值 | 來源 |
| --- | --- | --- |
| pageType（內部標記） | `static-page`（沿用一般固定頁；**非** `gated_download`） | `buildSeoForStaticPage` |
| robots | `index, follow` | `commonSeo` 預設 |
| canonical | `https://babel-lab.github.io/portable-blog-system/{slug}/` | `buildSeoForStaticPage` |
| sitemap | **include** | `build-sitemap.js` 顯式加入 |
| listings（home / post-list / 分類 / 標籤） | **exclude**（非 post，天然不入 `listingPosts`） | 由 build 結構保證 |

未使用 `gated_download` / `noindex` 類型（與 IA lock §8 一致）。

---

## 5. 驗證結果

| 指令 | 結果 | 對照 baseline |
| --- | --- | --- |
| `node src/scripts/build-github.js --mode=build` | PASS（兩頁生成；footer links 渲染） | — |
| `npm run validate:content` | 0 error / 134 warning / 106 post | 0 / 134 / 106 ✅ 不退步 |
| `npm run check:validation-report` | 27 passed / 0 failed | 27 / 0 ✅ |
| `node src/scripts/check-page-type-validator.js` | 103 passed / 0 failed | 103 / 0 ✅ |
| `npm run build:sitemap` | 16 url entries（含 `/privacy/`、`/affiliate-disclosure/`） | +2 揭露頁 |

人工檢視 generated HTML（`.cache/pages/`，gitignored）：

- `index.html` footer：`<nav class="lab-footer__links">` 含兩 `<a>`，href 為 `/portable-blog-system/privacy/`、`/portable-blog-system/affiliate-disclosure/`（basePath 正確、無 nofollow / 無 target）。
- `privacy/index.html` / `affiliate-disclosure/index.html`：`<title>` 正確、`robots = index, follow`、canonical 為站內絕對 URL；頁內交叉連結與「回首頁」皆帶 basePath。

> 註：build-github inline validate 之「1 warning on 1 post」= 既有 `portable-blog-system-mvp.md` 之 `page-noindex-in-listings`（documented download-listing 不對稱，**非**本階段引入）。

---

## 6. 未碰範圍（red lines 維持）

- ❌ 未碰：`content/`（任何 `.md`）、`content/settings/`（含 `footer.config.json` —— slug 早已對齊，**不需改**）、`package.json` / lockfile、`dist*/`、`gh-pages`、`.cache/`、generated HTML（皆 gitignored，未進 diff）。
- ❌ 未碰：Blogger 模板 / `build-blogger.js` / `dist-blogger/`（footer.ejs 僅由 GitHub `base.ejs` include，Blogger 輸出不受影響）。
- ❌ 未碰：funnel renderer / `downloadFunnel` / `gatedDownload` schema、download funnel renderer、Admin backend / write path、new-domain binding、`/tags/` nav、root legacy index.html、listing asymmetry cleanup。
- ❌ 未動：Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console。
- ❌ 未碰：LearnOops、CLAUDE.md、MEMORY.md。

---

## 7. Rollback

- 單一 phase commit，可 `git revert`。
- footer links 與兩揭露頁於同 commit 落地 → revert 不會留下 dead link 中間態。

---

## 8. 後續（不在本階段，待 Dean 指示）

- Blogger 端揭露呈現屬後台人工（系統無法 inject Blogger footer / head）—— 不在本階段。
- new-domain 啟用時揭露頁之絕對 URL / canonical 須另議（IA lock §9.3）。
- footer 揭露文案最終措辭、是否諮詢專業意見，由 Dean 核定（本頁為一般性資訊揭露，非法律意見）。
- 揭露頁樣式（`lab-footer__links` / `lab-footer__link` 目前無專屬 SCSS，沿用預設樣式）可於未來樣式階段補強。

---

*本階段為 footer disclosure 最小 source landing，僅碰 footer 渲染 + 兩揭露頁 + sitemap include + 本紀錄；未碰 Blogger live / Google backend / Admin backend / funnel renderer / LearnOops，未 commit 任何 generated output。*
