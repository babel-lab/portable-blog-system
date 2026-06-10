# GitHub Pages Project-Site URL — Baseline Note & Future Custom-Domain Policy

> **Phase**: `20260610-pm-7-github-pages-project-site-url-docs-sync-only-a`
> **Mode**: **docs-only sync**。更正前一份 R4 preflight doc 中誤寫之 user-site URL；記錄目前實際 project-site URL + future custom-domain policy。**不**改 `site.config.json` / base path / custom domain、**不** deploy、**不** Blogger repost、**不**改 content / src / registry。
> **Created**: 2026-06-10 +0800（14:00 起始）
> **Baseline**: main HEAD = origin/main = `ea6ba18` / gh-pages HEAD = origin/gh-pages = `2acb5a5` / clean / normal 0/69/59 / overlay 0/72/60 / smoke 14/14。
> **Supersedes（URL 部分）**: `docs/20260610-commerce-affiliate-box-r4-deploy-preflight.md` §3.1 / §3.3 之 user-site URL 假設（已於本 phase 一併更正標註）。

---

## 1. 現階段 GitHub Pages URL（authoritative）

本專案 GitHub Pages 為 **project site**（含 `/portable-blog-system/` subpath），**不是** user site。

| 項目 | 正確值（project site）|
| --- | --- |
| **GitHub Pages live base URL** | `https://babel-lab.github.io/portable-blog-system/` |
| **we-media live article URL** | `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/` |
| **`site.config.json.githubSiteUrl`（現狀，須維持）** | `https://babel-lab.github.io/portable-blog-system`（**本 phase 不改**）|
| **deploy branch** | `gh-pages`（origin/gh-pages = `2acb5a5`；GitHub Pages Source = branch `gh-pages` / root）|

### 1.1 誤寫更正（pm-5 R4 preflight doc）

`docs/20260610-commerce-affiliate-box-r4-deploy-preflight.md` 原 §3.1 / §3.3 將 GitHub Pages URL 誤寫為 **user-site** 形式：

- ❌ 誤寫 base：`https://babel-lab.github.io/`
- ❌ 誤寫 we-media：`https://babel-lab.github.io/posts/we-media-myself2/`

→ 已於本 phase 在該 doc 內標註更正為 project-site 形式（見上表）。**該誤寫僅為 doc 文字假設；實際 `site.config.json.githubSiteUrl` 早已正確設為 project-site，sitemap / asset / canonical 之 base path 均正確**（pm-6 R4a deploy 已 live 驗證於 project-site URL，無誤）。

### 1.2 為何 project-site 之下 build output 仍正確

- `site.config.json.githubSiteUrl = https://babel-lab.github.io/portable-blog-system` → sitemap absolute URL / canonical 之 base 正確含 subpath。
- `vite.config.js` build `base = './'` → asset 採**相對路徑**（root `./assets/`、nested post `../../assets/`）→ 無論掛載於哪個 subpath 皆正確 resolve（pm-6 實證 nested `../../assets/` 正確指向 `/portable-blog-system/assets/`）。
- 無 root-absolute（`/posts/`、`/assets/`）或 bare-domain（`https://babel-lab.github.io/posts/`）之硬編路徑。

---

## 2. Future custom-domain policy（**未來另開 phase；本 session 不處理**）

- BLOG 系統**第 1 階段完成後**，使用者**預計再申請新網址**（custom domain）。
- **custom domain / base URL / sitemap canonical / GitHub Pages custom domain（CNAME）之更新，必須未來另開獨立 phase 處理**；**不得**在 commerce R4 / Blogger repost / 任何 content phase 中順手處理。
- 該未來 phase 預期至少涉及（屆時另行規劃，本 note 不執行）：
  - `content/settings/site.config.json` 之 `githubSiteUrl`（改為新 domain）
  - 重跑 `npm run build` + `npm run build:sitemap`（反映新 base / canonical）
  - gh-pages 端 `CNAME` 檔（GitHub Pages custom domain 設定）
  - GitHub repo Settings → Pages → Custom domain + DNS（user 操作）
  - 既有 Blogger canonical / cross-link 是否需同步調整
- 在該 phase 落地前，**維持現狀** project-site URL `https://babel-lab.github.io/portable-blog-system/` 與 `githubSiteUrl = https://babel-lab.github.io/portable-blog-system` **不變**。

---

## 3. 現況狀態快照

| 項目 | 值 |
| --- | --- |
| main HEAD = origin/main | `ea6ba18` |
| gh-pages HEAD = origin/gh-pages | `2acb5a5`（GitHub Pages LIVE）|
| GitHub Pages live | ✅ project-site；we-media affiliate box（bottom-only）已上線 |
| Blogger repost | ❌ **remains not done**（R4b 未授權 / 未啟動）|
| normal validate / overlay / smoke | 0/69/59 / 0/72/60 / 14/14 |
| custom domain | ❌ 未申請；future phase |

---

## 4. Mutation scope / 紅線（本 phase）

- ✅ 僅更正 `docs/20260610-commerce-affiliate-box-r4-deploy-preflight.md`（3 處 URL）+ 新增本 note doc。
- ❌ 零 content / src / `site.config.json` / vite config / package / lockfile / registry / dist / dist-blogger / .cache / gh-pages / deploy branch 變更。
- ❌ 未 deploy / 未改 base path / 未改 custom domain / 未 Blogger repost / 未動 GA4 / reverse UTM / KOBO。

---

## 5. Suggested next safe phase（**不自動啟動**；各須 explicit approval）

- **R4b — Blogger repost**（須 user explicit approval + 確認 Blogger published URL + theme CSS `.lab-affiliate-box`）。
- **（未來，獨立 phase）custom domain / base URL 更新**（第 1 階段完成 + user 申請新網址後）。

---

*（本文件結束 — GitHub Pages project-site URL baseline note；更正 pm-5 doc user-site 誤寫；記錄 `githubSiteUrl` 維持 `https://babel-lab.github.io/portable-blog-system`；future custom domain 須另開 phase；docs-only，無 config / base path / deploy 變更；Blogger repost 仍未做。）*
