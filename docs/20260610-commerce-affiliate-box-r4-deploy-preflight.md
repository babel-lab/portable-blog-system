# Commerce Affiliate Box — R4 Deploy / Blogger Repost Preflight (read-only gate)

> **Phase**: `20260610-pm-5-commerce-affiliate-box-r4-deploy-preflight-readonly-a`
> **Mode**: **read-only preflight gate**。驗證 production-ready 狀態 + build output + 文件化 R4 deploy / Blogger repost 之人工核准與步驟、rollback、stop conditions。**不** deploy、**不** Blogger repost、**不** push deploy branch、**不**改 source / content / registry。
> **⚠️ 本 session 不授權 deploy。** 真正 deploy / Blogger repost 須**下一個 session 另行取得 user explicit approval**。
> **Created**: 2026-06-10 +0800（12:53 起始）
> **Baseline**: HEAD = origin/main = `51ac797` / clean / normal 0/69/59 / overlay direct-node 0/72/60 / smoke 14/14 / registry 10 active·0 held·1 excluded（KOBO）。
> **Predecessor**: `docs/20260610-commerce-we-media-myself2-affiliate-box-enable.md`（pm-4 content-only enable）。
> **References（read-only）**: `docs/github-deploy.md`（GitHub Pages 部署 runbook，方案 C 手動）、`docs/20260524-blogger-repost-checklist.md`（Blogger 後台重貼 SOP）、`docs/20260524-blogger-github-publishing-runbook.md`、`docs/publish-workflow.md`、`CLAUDE.md` §10 / §16.4 / §24 / §26。

---

## 1. Production-ready 狀態確認

| 項目 | 值 |
| --- | --- |
| HEAD = origin/main | `51ac797`（clean）|
| normal validate | 0/69/59 |
| overlay direct-node | 0/72/60 |
| resolver smoke | 14/14 PASS |
| commerce registry | schemaVersion 1 / 10 active / 0 held / 1 excluded（KOBO 不在 registry）/ all networkKey=books |
| we-media affiliate | enabled:true / position.top:false / position.bottom:true / 2 links use ref / network 通路王 / no raw url |
| **gh-pages（deploy branch）current** | `960f234 deploy: update ga4 link_type and hashtag wrap`（**落後於 source；affiliate box 尚未在 GitHub Pages live**）|
| GitHub Pages 部署方式 | **方案 C 手動**（無 `.github/workflows`；非 CI 自動）|
| Blogger repost | 手動（無 API；per CLAUDE.md §4/§29）|

---

## 2. Build / render preflight result（本地 build，未 deploy）

執行（read-only 檢查；build artifacts 皆 gitignored → git status clean）：

```
npm run validate:content   → 0 errors / 69 warnings / 59 posts
npm run build              → vite build → dist/（prebuild build-github --mode=build）
npm run build:sitemap      → dist/sitemap.xml（14 url entries）+ dist/robots.txt
npm run build:blogger      → dist-blogger/
```

**GitHub output `dist/posts/we-media-myself2/index.html`**:
- affiliate box = **1**；body(line 96) **之後**(box line 125) → **bottom box，無 top box**。
- 2 href 逐字 = registry targetUrl（含 `uid1=blog`）：`https://whitehippo.net/3QaKr?uid1=blog`、`https://adcenter.conn.tw/3QaLi?uid1=blog`。
- `href="undefined"`=0、`href=""`=0、ref-as-href=0、internalLabel leak=0。

**Blogger output `dist-blogger/posts/we-media-myself2/post.html`**:
- affiliate box = **1**；2 href 同上 exact（含 uid1=blog）；0 bad href / 0 leak。
- 配套產物：`copy-helper.txt` / `meta.json` / `publish-checklist.txt`（同 `dist-blogger/posts/we-media-myself2/`）。

**Excluded entry 確認**：KOBO 金石堂電子書（linkId `book-rouhou-time-kingstone-ebook-books` / `shoppingfun.co/3QWMC`）於 `dist/posts` + `dist-blogger/posts` 之 rendered affiliate output **0 occurrences** → excluded entry 不出現。

**git status**：clean（dist / dist-blogger / .cache 皆 gitignored，未 commit）。

---

## 3. Deploy gate analysis（文件化；**不執行**）

R4 有**兩個獨立 deploy surface**（we-media `site:blogger` 但 `publishTargets.github.enabled:true` → 同時上 GitHub Pages 與 Blogger）：

### 3.1 GitHub Pages（gh-pages branch；方案 C 手動）

| 項目 | 值 |
| --- | --- |
| **build command** | `npm run validate:content` → `npm run build` → `npm run build:sitemap`（順序固定；sitemap 必須在 build 後，per github-deploy.md §4）|
| **artifact path** | `dist/`（含 `posts/we-media-myself2/index.html`）|
| **deploy branch** | `gh-pages`（origin/HEAD → gh-pages；GitHub Pages Source = Deploy from branch `gh-pages` / root）|
| **deploy 步驟**（github-deploy.md §5.4 增量）| 於獨立 deploy worktree/clone（如 `D:\github\blog-new\portable-blog-deploy`）：`rm -rf ./*` → `cp -r ../portable-blog-system/dist/* .` → `touch .nojekyll` → `git add .` → `git commit -m "deploy: 51ac797 snapshot"` → `git push origin gh-pages` |
| **Pages URL** | **project site** `https://babel-lab.github.io/portable-blog-system/`（⚠️ **更正**：本 doc 原誤寫 user-site `https://babel-lab.github.io/`；實際為 project-site，含 `/portable-blog-system/` subpath，per pm-7 `docs/20260610-github-pages-project-site-url-note.md`）|
| **we-media live URL** | `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/`（⚠️ **更正**：原誤寫 `https://babel-lab.github.io/posts/we-media-myself2/`）|
| **手動複製 HTML？** | 否（GitHub Pages 直接 serve dist 靜態檔；只需 push gh-pages branch）|

### 3.2 Blogger repost（手動；per blogger-repost-checklist.md）

| 項目 | 值 |
| --- | --- |
| **要更新哪篇** | Blogger 後台對應「自媒自創 #2（提問筆記書）」之既有文章（slug `we-media-myself2`）。⚠️ **該文章之 Blogger published URL 須 user 確認**（frontmatter 無 `blogger.publishedUrl`；現 `relatedLinks` 指向 #1 文 `https://babel-lab.blogspot.com/2026/04/we-media-myself.html`，非本文）|
| **output 檔** | `dist-blogger/posts/we-media-myself2/post.html`（含 bottom affiliate box）|
| **手動複製 HTML？** | **是**。Blogger 後台 → 文章 → 編輯 → HTML 檢視 → 清空 → 貼入 post.html → 預覽 → 更新（先依 checklist §2.2 備份原 HTML）|
| **Theme CSS 依賴** | affiliate box 樣式 `.lab-affiliate-box` 已含於 `dist-blogger/theme/blogger-full-style.css`。⚠️ 若 Blogger 後台 theme CSS 尚未含此 rule（repost-checklist §0 記錄 theme CSS 自 `960f234` 後未重貼），box 可能無樣式 → 需一併重貼 theme CSS（checklist §3）|
| **copy-helper / checklist** | `dist-blogger/posts/we-media-myself2/copy-helper.txt`（標題 / 搜尋說明 / 標籤）+ `publish-checklist.txt`（單篇發布勾選）|

### 3.3 部署後 live checks（browser）

GitHub Pages（`https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/`；⚠️ 原誤寫 user-site URL，per pm-7 更正）+ Blogger 重貼後文章，各確認：
- 文章底部有且只有 **1 個** affiliate box（bottom），**無 top box**。
- 2 個 affiliate 連結文字 = 「博客來：實體書 通路王」/「金石堂：實體書 通路王」。
- 點擊 → 跳轉至 affiliate redirect（網址列含 `uid1=blog`；`whitehippo.net/3QaKr` / `adcenter.conn.tw/3QaLi`）。
- 連結 `rel="sponsored nofollow noopener noreferrer"` + `target="_blank"`（新分頁）。
- 無 `href="undefined"` / `href=""` / 破連結；無 internalLabel 顯示。
- 手機 / 桌機版面正常；console 無紅字。
- GA4（GitHub 端）：`click_affiliate_cta` event，`placement=article_bottom`（可選，屬 SOP）。

---

## 4. Rollback / stop conditions

### 4.1 Rollback 方法

| Surface | Rollback |
| --- | --- |
| **main（source）** | `git revert <commit>`（pm-4 `51ac797` 為 content-only，revert 安全；或 revert 至 `679519f`）→ push origin/main。posts 為純資料，revert 不影響其他。|
| **gh-pages（GitHub Pages）** | 於 deploy worktree `git revert` 該 `deploy:` commit 或 re-deploy 前一 dist snapshot（`960f234`）→ push origin gh-pages；GitHub Pages 1–5 分鐘重新 serve。|
| **Blogger repost** | 依 blogger-repost-checklist §6：Blogger 後台 → 文章 → HTML 檢視 → 清空 → 貼回 §2.2 備份之原 HTML → 更新。（theme CSS 若有重貼，另依 §6.2 貼回備份 CSS）|

### 4.2 Stop conditions（任一觸發 → 立即停止，不繼續 deploy，回報）

- output href 與 registry targetUrl **不一致**（含 `uid1=blog` 遺失 / 被 canonicalize）。
- affiliate box 位置錯誤（出現 top box / 非 bottom / 出現 >1 box）。
- unexpected source / content drift（git diff 出現非預期檔案）。
- `npm run validate:content` 出現 **error**（非 0 errors）。
- deploy branch dirty（gh-pages worktree 有未預期 modified / untracked）。
- Blogger 後台 HTML 與 expected output（`dist-blogger/posts/we-media-myself2/post.html`）**不一致**。
- rendered HTML 出現 `href="undefined"` / `href=""` / ref-as-href / internalLabel leak / KOBO excluded entry。

### 4.3 授權標記

> **本 session（pm-5）不授權 deploy / 不授權 Blogger repost。** R4 actual deploy 須**另開 session** 並取得 **user explicit approval**；前置 = R1+R2+R3+pm-3+pm-4+本 preflight accepted + user 確認（GitHub repo / Pages 設定 / Blogger published URL / 驗收時段）。pm-26 deploy gate remains BLOCKED；reverse UTM remains dormant（本 R4 與 reverse UTM 獨立；we-media `relatedLinks` 目前無 GitHub cross-link → 即使重貼亦無 reverse UTM 觸發路徑）。

---

## 5. Mutation scope / 紅線

- ✅ 僅新增本 docs preflight 文件（read-only preflight；CLAUDE.md 未改 — baseline 數字不變）。
- ❌ 零 registry / src / content / posts / templates / validation-fixtures / package / lockfile 變更。
- ❌ 零 dist / dist-blogger / .cache / gh-pages commit（build artifacts gitignored，僅用於檢查，git status clean）。
- ❌ 未 deploy / 未 push deploy branch / 未 Blogger repost / 未碰 Blogger 後台 / 未動 GA4 / reverse UTM。
- ❌ KOBO / 金石堂電子書 excluded entry 未啟用（rendered output 0 occurrences）。

---

## 6. Suggested next safe phase

**R4 actual deploy（須另開 session + user explicit approval）**：
1. **GitHub Pages**：build → 部署 dist 至 gh-pages（§3.1）→ live check（§3.3）。
2. **Blogger repost**：user 確認目標 Blogger 文章 URL → 備份 → 貼 post.html（必要時併 theme CSS）→ live check（§3.3）。
兩 surface 可分批或同批；各自須 user 在場驗收（§3.3 browser checks）。任一 stop condition 觸發即回滾（§4）。

---

*（本文件結束 — R4 deploy / Blogger repost read-only preflight；build/render verified（dist + dist-blogger we-media = 1 bottom box，2 href = registry targetUrl exact 含 uid1=blog，0 leak，KOBO 0 occurrence）；deploy gate / rollback / stop conditions 文件化；**本 session 不授權 deploy**；normal 0/69/59 + overlay 0/72/60 + smoke 14/14 不變；無 source/content/registry/deploy 變更。）*
