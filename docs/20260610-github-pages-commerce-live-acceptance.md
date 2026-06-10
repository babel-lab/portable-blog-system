# GitHub Pages Commerce Affiliate Box — Live Acceptance Checkpoint

> **Phase**: `20260610-pm-8-github-pages-commerce-live-acceptance-docs-only-a`
> **Mode**: **docs-only acceptance**。記錄 user 人工確認 GitHub Pages live site 之 commerce affiliate box（通路王區塊）已正確顯示。**不** deploy、**不** Blogger repost、**不**改 content / source / registry / config。
> **Created**: 2026-06-10 +0800（14:11 起始）
> **Baseline**: main HEAD = origin/main = `55904a6` / gh-pages HEAD = origin/gh-pages = `2acb5a5` / clean / normal 0/69/59 / overlay 0/72/60 / smoke 14/14。
> **Predecessor**: `docs/20260610-commerce-affiliate-box-r4-deploy-preflight.md`（pm-5 preflight）、`docs/20260610-github-pages-project-site-url-note.md`（pm-7 project-site URL）；R4a deploy = pm-6（gh-pages `960f234`→`2acb5a5`）。

---

## 1. Live acceptance record

| 項目 | 值 |
| --- | --- |
| **GitHub Pages project-site URL** | `https://babel-lab.github.io/portable-blog-system/` |
| **we-media live article URL** | `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/` |
| **gh-pages deployed commit** | `2acb5a5` |
| **main commit source** | `55904a6` |
| **使用者人工確認時間** | `2026-06-10 14:11`（+0800）|
| **使用者確認內容** | 文章內有出現「**通路王區塊**」（commerce affiliate box）|
| **live acceptance verdict** | ✅ **PASS** |
| **Blogger repost status** | ❌ **NOT DONE** |
| **custom domain status** | future phase（after BLOG system phase 1 completion）|

---

## 2. Acceptance basis

本 acceptance 結合**自動驗證**（pm-6 R4a deploy 時）+ **人工確認**（本 phase）：

- **自動（pm-6 WebFetch live check）**：we-media live 頁面載入正常，「立即購買」1 affiliate block / 2 links —— 「博客來：實體書 通路王」→ `https://whitehippo.net/3QaKr?uid1=blog`、「金石堂：實體書 通路王」→ `https://adcenter.conn.tw/3QaLi?uid1=blog`（皆 exact 含 `uid1=blog`），無 broken / `href="undefined"`，無 internalLabel。
- **人工（pm-8 本 phase）**：使用者於 `2026-06-10 14:11` 親自開啟 live site，確認 we-media 文章內**有出現「通路王區塊」** → verdict **PASS**。

兩者一致 → GitHub Pages 端 commerce affiliate box live acceptance **PASS**。

---

## 3. 現況狀態快照

| 項目 | 值 |
| --- | --- |
| main HEAD = origin/main | `55904a6` |
| gh-pages HEAD = origin/gh-pages | `2acb5a5`（GitHub Pages LIVE，已 user-accepted）|
| GitHub Pages | ✅ project-site live；we-media affiliate box（bottom-only）**user-confirmed PASS** |
| Blogger repost | ❌ **NOT DONE**（R4b 未授權 / 未啟動）|
| custom domain | future phase（第 1 階段完成後 user 申請新網址；須另開 phase，per `docs/20260610-github-pages-project-site-url-note.md` §2）|
| `site.config.json.githubSiteUrl` | `https://babel-lab.github.io/portable-blog-system`（維持不變）|
| normal validate / overlay / smoke | 0/69/59 / 0/72/60 / 14/14 |
| commerce registry | 10 active / 0 held / 1 excluded（KOBO 不在 registry）|

---

## 4. Mutation scope / 紅線（本 phase）

- ✅ 僅新增本 acceptance docs file。
- ❌ 零 content / src / `site.config.json` / vite config / package / lockfile / registry / dist / dist-blogger / .cache / gh-pages / deploy branch 變更。
- ❌ 未 deploy / 未 Blogger repost / 未動 GA4 / reverse UTM / KOBO excluded entry。

---

## 5. Suggested next safe phase（**不自動啟動**；各須 explicit approval）

- **R4b — Blogger repost**（須 user explicit approval + 確認 Blogger published URL + theme CSS `.lab-affiliate-box`）→ 使 Blogger 端文章亦顯示通路王區塊（目前 Blogger 端仍為舊版無 box）。
- **（未來，獨立 phase）custom domain / base URL 更新**（第 1 階段完成 + user 申請新網址後）。

---

*（本文件結束 — GitHub Pages commerce affiliate box live acceptance **PASS**（user 人工確認 2026-06-10 14:11，文章內出現通路王區塊）；gh-pages `2acb5a5` / main `55904a6`；docs-only，無 deploy / content / source / registry / config 變更；Blogger repost NOT DONE；custom domain future phase。）*
