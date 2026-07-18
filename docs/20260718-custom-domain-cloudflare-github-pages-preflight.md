# Custom domain preflight — `babel-lab.net` × Cloudflare Registrar / DNS × GitHub Pages

- 建立日期：2026-07-18（Asia/Taipei）
- 類型：**docs-only preflight**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：對 `babel-lab.net` × Cloudflare Registrar + Cloudflare DNS × GitHub Pages custom domain 上線做**單頁 preflight**（決策 + 依官方文件核對 + repo 端 blocker inventory + 兩階段執行順序 + 驗證 / rollback / next-slice）。
- 上位（本 doc 不重寫其論述）：
  - `docs/20260710-custom-domain-adsense-trigger-checklist.md`（Gate D / Gate A 分離；trigger conditions）
  - `docs/20260708-domain-github-pages-adsense-decision.md`（是否 / 何時買）
  - `docs/custom-domain-root-files-strategy.md`（`CNAME` / `ads.txt` / `robots.txt` / `sitemap.xml` 遷移機制）
  - `docs/github-deploy.md` §5 / `docs/checklists/github-deploy-checklist.md` §4.4（現行 deploy 手動 rsync pattern）

---

## 0. Status banner（本 session 界線）

```
Status:                          PREANALYSIS / NOT EXECUTED
Domain registration:             NOT AUTHORIZED IN THIS DOCUMENT
DNS write:                       NOT AUTHORIZED
GitHub Pages custom-domain change: NOT AUTHORIZED
Deploy:                          NOT AUTHORIZED
Target date:                     2026-08-01（tentative；本 doc 不代表今日已授權購買或切換）
```

本 session 唯一允許 mutation：新增本檔（+ commit + push origin/main）。**不** build / **不** preview / **不** deploy / **不** 註冊網域 / **不** 動 Cloudflare / **不** 動 DNS / **不** 改 `content/settings/site.config.json` / **不** 改 `src/**` / **不** 改 `dist*/` / **不** 動 deploy clone / **不** 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不** 動 backfill 語意 / **不** 碰 Blogger / AdSense / GA4 / Search Console 後台。

---

## 1. Executive verdict

### 1.1 `babel-lab.net` 是否適合作 apex canonical？

✅ **適合**。理由：

1. GitHub Pages 官方支援 apex 作 custom domain（`docs.github.com/en/pages/.../managing-a-custom-domain-for-your-github-pages-site`，見 §5.1 引述之 A records / redirect 行為）。
2. Cloudflare DNS 於 apex 支援 CNAME flattening（`developers.cloudflare.com/dns/cname-flattening/`），apex ↔ `<user>.github.io` 之路徑無 registrar / DNS 層阻擋。
3. 於 GitHub Pages settings 把 `babel-lab.net`（apex）設為 custom domain 時，`www.babel-lab.net` 之 DNS 若同時設好，GitHub Pages 會**自動** 301 `www` → apex（GitHub 官方明列此行為，見 §5.1）。canonical 主體性簡單、無雙 URL 問題。
4. 現行 source 之 `site.config.json.githubSiteUrl` 消費者集中（見 §3），apex canonical **不需**任何 subpath 相容邏輯；反而**自動移除** `/portable-blog-system/` project-site subpath。

### 1.2 Repo 是否已具備切換條件？

🟡 **接近但有一項 blocking source change**。要點：

1. ✅ URL 生成單一 source of truth：`content/settings/site.config.json` `githubSiteUrl`（35+ 消費者，見 §3）；改一處 build 產物即帶新 hostname。
2. ✅ `vite.config.js` 之 `base = command === 'serve' ? '/' : './'` 已為 relative，切網域不需動 vite base。
3. ✅ `src/scripts/build-github.js:128 siteBasePath()` 由 `githubSiteUrl` 的 pathname 推導 project-site `basePath`；apex `babel-lab.net` 之 pathname 為空 → `basePath = ''`，internal navigation 自動退回 root-relative。
4. ✅ `src/scripts/build-sitemap.js:33 siteBaseUrl()` 同樣讀 `githubSiteUrl`；sitemap `<loc>` 與 robots `Sitemap:` 自動帶新 hostname。
5. ✅ `src/scripts/ga4-url-builder.js:113` 之 `isGithubCrossLink()` 讀 `githubSiteUrl` hostname；apex 之 hostname `babel-lab.net` 自動成為 cross-link 判斷基準。
6. ✅ Blogger cross-link UTM 生成器（`src/scripts/build-blogger.js` + `blogger-render.js`）從同一 config 派生，hostname-only update 即可（`docs/custom-domain-root-files-strategy.md` §4.4 已預定）。
7. 🔴 **BLOCKING（deploy-side）**：現行 deploy runbook（`docs/github-deploy.md` §5.4）與 checklist 之增量部署動作為 `rm -rf ./*` → `cp -r dist/* .` → `touch .nojekyll`；**未** preserve `CNAME`。cutover 後任何後續 deploy 會**刪除 `CNAME` 檔** → GitHub Pages custom domain 失效（見 §4.3 / §5.5 / §10）。此為 cutover 前**必須**先修正之 source-side change（見 §11）。
8. 🟡 **content-level hardcoded absolute URL**（各屬個案；影響輕微）：
   - `content/github/posts/20260504-github-pages-blog-planning.fb.md:19` — FB 貼文樣本硬編舊 hostname `https://babel-lab.github.io/posts/...`（缺 `/portable-blog-system` prefix，本就是 legacy 樣本；cutover 時可與此文一起改）。
   - `content/validation-fixtures/github/posts/_test-page-type-redirect-canonical-valid.md:13` — validator fixture 用當前 project-site canonical；屬 fixture 資料、非 production 內容，可獨立 sync。
   - `content/blogger/posts/20260529-phonics-practice-sheet-download.md:50` — Blogger cross-link 硬指 `https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/`；cutover 時需 hostname update（`docs/custom-domain-root-files-strategy.md` §4.4 `custom-domain-blogger-redirect-1` 已預定）。
9. 🟡 GA4 measurement ID 之 hostname 對照 = production 已 LIVE 且已於 2026-06-24 完成 Realtime / DebugView 一輪觀察；cutover 後**須** Dean 手動於 GA4 後台更新 Data Stream Website URL（measurementId 不變）並重跑 Realtime 觀察 —— 屬 Dean 手動任務、非 source change。

### 1.3 有哪些 blocking changes？

| # | Change | 屬性 | 位置 | 本 doc 是否執行 |
| --- | --- | --- | --- | --- |
| 1 | Deploy wipe pattern 排除 `CNAME`（同 `.nojekyll` 之處理） | source docs + checklist edit | `docs/github-deploy.md` §5.3/§5.4 + `docs/checklists/github-deploy-checklist.md` §4.4 | ❌ 未執行（本 doc 記錄；下一 slice 執行，見 §11）|
| 2 | `content/settings/site.config.json.githubSiteUrl` = `https://babel-lab.net` | source config | 單一 JSON 欄位 | ❌ 未執行（cutover 當日 gate 後執行）|
| 3 | Content-level cross-link hostname update | content | 上述 §1.2 #8 三檔 | ❌ 未執行（cutover 之後續 slice）|

**#1 為 cutover 前 blocking**（若 cutover 前不修，第一次 cutover 後之下一次 deploy 就會 wipe `CNAME` → domain 中斷）。#2、#3 為 cutover 當日 / 之後 slice。

### 1.4 今日能否安全註冊但不切 DNS？

⚠️ **Cloudflare Registrar 之新註冊路徑**：新註冊之 domain 於 Cloudflare Registrar 通常會在註冊完成時**同時建立 zone、使用 Cloudflare nameservers**（Cloudflare Registrar 之預設路徑；`developers.cloudflare.com/registrar/` 之上下文），DNS zone 於註冊當下建立、但**內部無任何 A / AAAA / CNAME / TXT record**（除 Cloudflare 預設的 nameserver records）。此狀態下：

- ✅ `babel-lab.net` 於 WHOIS 已註冊為 Dean 名下（Registrar = Cloudflare、WHOIS redacted by default）。
- ✅ DNS 尚未指向 GitHub Pages → 對 GitHub Pages 現有 project-site 服務**零影響**、對 SEO 現況零影響、對 GA4 / AdSense 零影響。
- ✅ 之後可分階段設 DNS + 加 verification TXT + 設 CNAME 於 deploy repo + 於 GitHub Pages settings 填 custom domain + 等 TLS + Enforce HTTPS，**每步各自可 rollback**。

**因此**：2026-08-01 若 Dean 明確授權，可**只做註冊 + 空 zone**，不同日切 DNS。切 DNS 之 gate 為獨立、非自動連動。

### 1.5 哪些操作一定要等 Dean 當天人工執行

以下**只能**由 Dean 手動（Claude 不代 Dean 操作、不代填、不代決策）：

- 於 Cloudflare Registrar 後台實際購買 `babel-lab.net`（信用卡 / 付款）
- 於 Cloudflare DNS 後台建立 / 修改 / 刪除 DNS records（含 A / AAAA / CNAME / TXT / CAA / DNSSEC）
- 於 Cloudflare DNS 後台切換 record 之 proxy 狀態（orange / gray cloud）
- 於 Cloudflare Registrar 後台啟用 DNSSEC one-click（`developers.cloudflare.com/dns/dnssec/`）
- 於 GitHub personal profile 設定端加 domain verification TXT / 送 verification
- 於 GitHub repo Settings → Pages 端填 custom domain / 勾 Enforce HTTPS / 移除 custom domain
- 於 GA4 後台改 Data Stream Website URL
- 於 Google Search Console 端加 property + 驗證 + submit sitemap
- 觀察 Realtime / DebugView 端流量

---

## 2. Frozen baseline

本 session 起始 read-only 驗證通過：

| Repo | Branch | HEAD | 對照 remote | ahead / behind | tree | index.lock | dist-blogger-preview |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `cb42449` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `0eaf9c6` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ | n/a |

Source HEAD full = `cb4244971a025ed59f5db2ca2dede307357d317b`；subject `test(docs): guard blogger preview sanity status`。前 4 commit：`0a53812`（test preview status）→ `a0707c9`（docs blogger preview runbook）→ `2f70290`（feat preview artifact builder）→ `22f1789`（feat preview target planner）。

Deploy HEAD full = `0eaf9c686ca3ed0d082443baec67197a77cb86fd`；subject `deploy(github): unpublish what-is-design-token; sync source 8a062b7`。

Deploy root：無 `CNAME` 檔（per boot verify）。

---

## 3. Current URL architecture inventory

以下 table 為 read-only 掃描結果（`grep` `githubSiteUrl` + `babel-lab.github.io` + `portable-blog-system`），已排除 dist 產物、docs 敘述、archive；聚焦 **runtime source of truth**。

| # | Path | Line / symbol | Current value | Runtime role | Custom-domain impact | Action eventually required |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `content/settings/site.config.json` | line 5 `githubSiteUrl` | `"https://babel-lab.github.io/portable-blog-system"` | **Single source of truth** for all builders | 改為 `https://babel-lab.net` 即完成 90% source-side migration | YES（`custom-domain-prep-1`）|
| 2 | `src/scripts/build-github.js` | line 116 `siteBaseUrl()` / line 128 `siteBasePath()` | consumer of `githubSiteUrl` | derive base URL + in-site basePath | apex → `basePath=''`（因 `new URL('https://babel-lab.net').pathname === '/'` → replace `/+$` → `''`） | 無 code change；validate via build |
| 3 | `src/scripts/build-sitemap.js` | line 33 `siteBaseUrl()` + `buildRobotsTxt()` line 63 | consumer of `githubSiteUrl` | sitemap `<loc>` + robots `Sitemap:` line | 自動帶新 base URL | 無 code change；validate via build |
| 4 | `src/scripts/blogger-render.js` | line 268 / 342 | consumer of `githubSiteUrl` | Blogger→GitHub cross-link canonical URL 生成 | Blogger 貼文中 GitHub cross-link 之 canonical / target 會帶新 hostname | 無 code change；下次 blogger build + repost |
| 5 | `src/scripts/ga4-url-builder.js` | line 61 `absolutizeUtmedUrl()` + line 113 `isGithubCrossLink()` | consumer of `githubSiteUrl` hostname | 判定跨站 UTM + 生成 blogger→github 目標 URL | apex hostname `babel-lab.net` 自動成為判斷基準；既有 `babel-lab.github.io` 跨站判定會**失效**（正確；cutover 後 old hostname 不再屬本站） | 無 code change |
| 6 | `src/scripts/build-promotion.js` | line 114 | consumer for FB promotion txt URL | FB 貼文 txt 之 URL 值 | 自動帶新 hostname | 無 code change |
| 7 | `src/scripts/check-download-indexing-dist-smoke.js` | line 94 `SITE_BASE` | consumer of `githubSiteUrl` | dist smoke check | 自動帶新 URL；scanned files 之 hostname 比對點 | 無 code change |
| 8 | `src/scripts/load-admin-posts.js` | line 100 / 598 / 821 | consumer for admin previewUrl | Admin dev-mode dashboard；不進 prod | 自動帶新 URL；ADMIN dev-only、無 deploy 影響 | 無 code change |
| 9 | `src/scripts/normalize-post-output.js` | line 586 | consumer of `githubSiteUrl` / legacy alias | normalize 內部 URL | 自動帶新 URL | 無 code change |
| 10 | `vite.config.js` | line 11 | `base = command === 'serve' ? '/' : './'` | vite MPA base | **無需**改；relative base 兼容 apex 與 subpath | 無 code change |
| 11 | `content/github/posts/20260504-github-pages-blog-planning.fb.md` | line 19 | hardcoded `https://babel-lab.github.io/posts/...`（legacy sample；缺 project-site prefix） | FB promotion sample | 個案 hostname update（若這篇未上線可暫緩） | YES（後續 slice；非 cutover blocker）|
| 12 | `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | line 50 | hardcoded `https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/` | Blogger 內 GitHub cross-link | 需 hostname update | YES（`custom-domain-blogger-redirect-1`；非 cutover blocker）|
| 13 | `content/validation-fixtures/github/posts/_test-page-type-redirect-canonical-valid.md` | line 13 | fixture canonical | validator fixture；非 production 內容 | 個案 hostname update；不影響 live behavior | YES（後續 slice；可獨立於 cutover）|
| 14 | `src/scripts/smoke-reverse-utm.js` | line 25 | test fixture `githubSiteUrl: 'https://babel-lab.github.io'` | 硬編 hostname 用於單元 smoke | 屬 test scaffold；apex 切換後可獨立 sync（或保留 legacy 值以驗跨 hostname 邏輯） | Optional |
| 15 | `docs/github-deploy.md` §5.3 line 165–177 + §5.4 line 184–192 + `docs/checklists/github-deploy-checklist.md` §4.4 | `rm -rf ./*` / `touch .nojekyll` | **未** preserve `CNAME` | 🔴 **BLOCKING**：cutover 後首次 redeploy 就會 wipe `CNAME` → domain 中斷 | YES（下一 slice）|
| 16 | `content/settings/ads.config.json`（real `adsenseClient` / `slot id`）| n/a | red-line：**不進 docs / src / views / frontmatter / ledger** | AdSense 現 loader 讀此 config；apex 切換**不改** ads.config.json；AdSense 屬 Gate A、獨立 | 無變（Gate A 另 phase）|
| 17 | GA4 measurement ID | `src/views/tracking/ga4.ejs`（存在；未直接讀 `githubSiteUrl`，經由 template partial 注入）| 現 measurement ID = production live 自 2026-05-21；不外流至本 doc | Data Stream URL 於 GA4 後台指向 project-site URL；measurementId 不變、與 hostname 解耦 | Data Stream URL update = **Dean 手動**（非 source change）|

**Deploy artifact 狀態**（read-only sample，`/d/github/blog-new/portable-blog-deploy/`）：

| Artifact | 現行值 | Cutover 後預期值 |
| --- | --- | --- |
| `robots.txt` line 5 | `Sitemap: https://babel-lab.github.io/portable-blog-system/sitemap.xml` | `Sitemap: https://babel-lab.net/sitemap.xml` |
| `sitemap.xml` `<loc>` | 全帶 `https://babel-lab.github.io/portable-blog-system/...` | 全帶 `https://babel-lab.net/...` |
| `index.html` canonical / og:url / JSON-LD `@id` / `url` | `https://babel-lab.github.io/portable-blog-system/` | `https://babel-lab.net/` |
| `posts/*/index.html` canonical | 同上帶 subpath | 同上 apex |
| `CNAME` | ❌ 不存在 | ✅ 單行 `babel-lab.net`（cutover 建立）|
| `.nojekyll` | ✅ 存在（既有）| ✅ 保留（既有）|

**JSON-LD / Open Graph 掃描**：`build-github.js` 之 `renderPostDetail` 路徑透過 `siteBaseUrl(settings)` 與 `absolutizeUrl()`（line 146）產生所有 canonical / og:url / JSON-LD `@id` / `url` / `image`；無其他絕對 URL 來源。`src/views/pages/post-detail.ejs` 與 `src/views/seo/*.ejs` 讀 build-derived 變數、不含 hardcoded hostname。

**Assets 相對性**：`vite.config.js` `base='./'`（build）+ EJS 內 `<%= basePath %>{root-relative}` pattern（`build-github.js:120` 註釋）→ CSS / JS / images 之 href 於 apex（`basePath=''`）與 project-site（`basePath='/portable-blog-system'`）皆可正常解析；apex cutover 後 assets 直接 root-relative 可達，**無需**額外 rewrite。

**Feed / RSS / Atom**：本專案未產出 RSS / Atom feed（CLAUDE.md §28 MVP 清單無 feed 項）。

---

## 4. Canonical-host decision

| 項目 | 鎖定值 | Source |
| --- | --- | --- |
| **Primary canonical host** | `babel-lab.net`（apex） | Dean 指定 target |
| **Secondary host** | `www.babel-lab.net` | 提供輸入相容性 + 標準習慣 |
| **Redirect direction** | `www.babel-lab.net` → `babel-lab.net`（automatic by GitHub Pages 當 custom domain = apex） | GitHub Docs：`If you instead configure example.com as the custom domain, then www.example.com will redirect to example.com` |
| **Default `babel-lab.github.io/portable-blog-system/` URL treatment** | GitHub Pages 於 custom domain 啟用後**自動** 301 legacy default URL → custom domain（GitHub Pages 一般行為；DNS TTL / cache 期間可能舊新並存） | 依 GitHub Pages 一般行為（troubleshooting doc 提及 auto redirect）；cutover 後由 Dean 觀察一次 curl 驗證（見 §9.4） |
| **Trailing-slash policy** | 沿用**現行**：所有 post / category / tag / static page URL 皆 `/foo/`（trailing slash）；apex + subpath removal 後 URL 形態 = `https://babel-lab.net/posts/{slug}/`；`build-github.js` / `build-sitemap.js` 既有 trailing-slash 慣例不變 | 現行 output |
| **HTTP → HTTPS policy** | Enforce HTTPS = 勾 ✅（cutover 完成、certificate 完成後）；GitHub Pages 端 transparent redirect HTTP → HTTPS | GitHub Docs：`transparently redirect all HTTP requests to HTTPS` |
| **Duplicate-content risk** | 🟡 中：cutover 後過渡期 legacy `babel-lab.github.io/portable-blog-system/` URL 於 Google 索引仍會出現；GitHub Pages auto 301 有助自然收斂；Dean 於 GSC 之 URL Removal / 新 sitemap submit 為輔助手段（見 §9.11） | GSC 官方（一般 SEO 邏輯）|

**為何 apex 而非 `www`**：Dean 指定 `babel-lab.net`（apex）；apex 短、易記、無 `www` 前綴語意冗餘；GitHub Pages 於 apex 為 custom domain 時自動處理 `www` → apex 之 301，不需 dual-canonical 策略。

**為何 secondary host `www` 仍要設 DNS**：使用者仍可能輸入 `www.babel-lab.net`；若不設 DNS，會直接 NXDOMAIN（bad UX）；若設 CNAME 至 `babel-lab.github.io`，GitHub Pages 之 auto 301 生效、無 SEO 分裂。

**為何 default `github.io` URL 之處置採「靠 GitHub 自動 301 + 觀察」**：GitHub Pages 之 official troubleshooting 未明列此 301 之詳細條件；社群普遍觀察為「custom domain 啟用後 legacy URL 自動 301 至 custom domain」，本 doc 依此常見行為記錄、但**須 cutover 當日以 `curl -I` 驗證**（見 §9.14）。若實測未 301，退回方案 = 於 legacy URL 上不做任何額外處理（讓 Google 自然 de-dup），非 blocking。

---

## 5. DNS record matrix

**⚠️ 引用來源**：以下 A / AAAA record 值取自 GitHub Docs `Managing a custom domain for your GitHub Pages site`（2026-07-18 accessed；本 doc §5.1 逐字引述）；TXT 格式與 CAA 語意取自 GitHub 官方 `Verifying your custom domain for GitHub Pages` 與 `Troubleshooting custom domains and GitHub Pages`。Cutover 當日 Dean **仍應**於 Cloudflare DNS 端手動再核對一次官方頁面之當時最新值（避免 IP 變更）。

### 5.1 GitHub Pages 官方 DNS 目標值（2026-07-18 accessed）

| 用途 | 值 |
| --- | --- |
| Apex A（4 筆） | `185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153` |
| Apex AAAA（4 筆） | `2606:50c0:8000::153` / `2606:50c0:8001::153` / `2606:50c0:8002::153` / `2606:50c0:8003::153` |
| Subdomain CNAME target | `<user>.github.io`（excluding repository name）→ 本專案 = `babel-lab.github.io` |
| Domain verification TXT record 名 | `_github-pages-challenge-<USERNAME>.<domain>` → 本專案 = `_github-pages-challenge-babel-lab.babel-lab.net` |
| Domain verification TXT value | 由 GitHub 於 profile settings 端 issue 之 challenge token（Dean 於申請 verification 時複製；本 doc **不**猜） |

**引述**（GitHub Docs, `Managing a custom domain for your GitHub Pages site`）：
> `The CNAME record should always point to <user>.github.io or <organization>.github.io, excluding the repository name.`
> `if you configure www.example.com as the custom domain for your site, and you have GitHub Pages DNS records set up for the apex and www domains, then example.com will redirect to www.example.com. If you instead configure example.com as the custom domain, then www.example.com will redirect to example.com.`

**引述**（GitHub Docs, `Securing your GitHub Pages site with HTTPS`）：
> `Any additional A, AAAA, ALIAS, ANAME records with the @ host, or CNAME records pointing to your www subdomain or other custom subdomain that you would like to use with GitHub Pages may prevent the HTTPS certificate from generating.`

### 5.2 Cutover 目標 DNS 表

| # | Record type | Name | Target / value | Proxy mode（初始）| TTL | Required by | When to create | When to remove | Validation | Rollback action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | A | `@`（apex `babel-lab.net`）| `185.199.108.153` | 🟡 DNS-only（gray cloud）| Auto（Cloudflare default）/ 或 Dean 手動 300s | Stage 2 Step 5 | cutover 當日之 DNS 設定步驟 | rollback 或永久 opt-out custom domain 時 | `dig +short babel-lab.net A` = 上述四值集合 | 刪除本記錄 |
| D2 | A | `@` | `185.199.109.153` | 🟡 DNS-only | 同 D1 | 同 D1 | 同 D1 | 同 D1 | 同 D1 |
| D3 | A | `@` | `185.199.110.153` | 🟡 DNS-only | 同 D1 | 同 D1 | 同 D1 | 同 D1 | 同 D1 |
| D4 | A | `@` | `185.199.111.153` | 🟡 DNS-only | 同 D1 | 同 D1 | 同 D1 | 同 D1 | 同 D1 |
| D5 | AAAA | `@` | `2606:50c0:8000::153` | 🟡 DNS-only | 同 D1 | Stage 2 Step 5（IPv6 可選但建議）| 同 D1 | 同 D1 | `dig +short babel-lab.net AAAA` = 上述四值集合 | 刪除本記錄 |
| D6 | AAAA | `@` | `2606:50c0:8001::153` | 🟡 DNS-only | 同 D1 | 同 D5 | 同 D5 | 同 D5 | 同 D5 |
| D7 | AAAA | `@` | `2606:50c0:8002::153` | 🟡 DNS-only | 同 D1 | 同 D5 | 同 D5 | 同 D5 | 同 D5 |
| D8 | AAAA | `@` | `2606:50c0:8003::153` | 🟡 DNS-only | 同 D1 | 同 D5 | 同 D5 | 同 D5 | 同 D5 |
| D9 | CNAME | `www` | `babel-lab.github.io.` | 🟡 DNS-only | Auto / 300s | Stage 2 Step 5 | 同 D1 | rollback 或 opt-out `www` | `dig +short www.babel-lab.net` = `babel-lab.github.io.` | 刪除本記錄 |
| D10 | TXT | `_github-pages-challenge-babel-lab` | 由 GitHub profile settings 端 issue 之 challenge token（Dean 於申請時取得；**Claude 不猜、不代填**）| n/a（TXT 無法 proxy；`developers.cloudflare.com/dns/proxy-status/` 明列 TXT always DNS-only）| Auto | Stage 2 Step 4 | GitHub 於 profile 端要求 verification 時 | verify 通過後**永久保留**（GitHub Docs：`keep the TXT record in your domain's DNS configuration`）| `dig +short TXT _github-pages-challenge-babel-lab.babel-lab.net` = 匹配 challenge token | 刪除本記錄（等同放棄 verification） |
| D11（可選）| CAA | `@` | `0 issue "letsencrypt.org"`（若要加 CAA，**必須**包含此值以允許 Let's Encrypt 簽發）| n/a | Auto | Optional（僅在 Dean 要加 CAA 時；若不加 CAA，GitHub / Let's Encrypt 之簽發不受影響）| Stage 2 Step 5 之後、Enforce HTTPS 之前 | 若之後要 rollback | `dig +short CAA babel-lab.net` = 包含 `letsencrypt.org` 之 issue 記錄 | 刪除本記錄 |
| D12（**永不建**）| CAA | `@` | 任何**不含** `letsencrypt.org` 之 CAA 記錄 | n/a | n/a | ❌ **永不建**（GitHub Docs: `at least one CAA record must exist with the value letsencrypt.org for your site to be accessible over HTTPS`）| n/a | n/a | n/a | n/a |

**Proxy mode 註記**：本表初始一律鎖定 **DNS-only（gray cloud）**，理由見 §6.2。cutover 完成、certificate provisioning 成功、Enforce HTTPS 生效之後，是否切至 proxied（orange cloud）為**獨立決策**（見 §6.2 之 Stable-state proxy mode 討論），本 doc 不預設。

**Wildcard 註記**：GitHub Docs 明列 `We strongly recommend that you do not use wildcard DNS records.`。本 doc 亦不建 wildcard。

**其他既有 record**：`babel-lab.net` 為**新註冊**、初始 zone 空；Cloudflare 預設之 `NS` records 由 Cloudflare 自動維護（不進本表）。若 Dean 之後另加 email / MX / SPF / DKIM / DMARC records（本 doc scope 外、屬 email 訂閱 use case），須確認**不與 apex 之 A / AAAA 衝突**。

### 5.3 CAA 決策

**Recommendation**：Stage 2 首次 cutover **不加** CAA（保留 open）。若之後要加 CAA，**必須**包含 `0 issue "letsencrypt.org"`（GitHub 之 Let's Encrypt 簽發依賴）。若加了 CAA 但**忘了** `letsencrypt.org`，Enforce HTTPS 會失敗。

### 5.4 Nameservers 註記

新註冊之 domain 於 Cloudflare Registrar，**預設**使用 Cloudflare 之 assigned nameservers（Dean 於 Cloudflare Registrar 後台可見「Nameservers → <assigned>.ns.cloudflare.com」）；本 doc **不猜**具體 nameserver 名稱（每 zone 分配值不同）。cutover 前 Dean 於 Cloudflare Registrar 後台**手動**再核對一次「zone active」+「nameservers = Cloudflare assigned」。

---

## 6. GitHub Pages configuration matrix

| # | 項目 | 現況 | Cutover 目標 | 操作位置 | 依賴 | 備註 |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | **Domain verification TXT**（GitHub profile settings 端） | ❌ 未設 | ✅ 已 verify `babel-lab.net`（含 immediate subdomains）| GitHub → 右上頭像 → Settings → Pages（**profile-level**，非 repo-level）| DNS D10 已建立 + 已 propagate | GitHub Docs: `Domain verification happens at the profile level`。verify 之 immediate subdomain propagation 屬 GitHub Docs 明列（`docs.github.com/en/pages/.../verifying-your-custom-domain-for-github-pages`）。|
| P2 | **Pages custom-domain setting**（repo settings 端） | `Custom domain` = 空 | `Custom domain` = `babel-lab.net`（apex）| deploy repo（`babel-lab-lab/portable-blog-deploy` 或 對應 gh-pages source repo）→ Settings → Pages | P1 + DNS D1–D9 | 填此欄後 GitHub 自動建立 `CNAME` 於 deploy branch root（**同時**觸發 DNS check + certificate provisioning queue；`docs.github.com/.../managing-a-custom-domain-for-your-github-pages-site` 提及此互動）|
| P3 | **`CNAME` artifact in gh-pages root** | ❌ 不存在 | ✅ 存在（P2 自動建立）+ **後續 deploy 必須 preserve**（不能 wipe）| deploy repo gh-pages root | P2 | **與 §11 next slice #1 之 deploy pattern 修正協同**：`docs/github-deploy.md` §5.4 之 `rm -rf ./*` **必須改為** `find . -mindepth 1 ! -name '.git' ! -name '.nojekyll' ! -name 'CNAME' -exec rm -rf {} +`（同 pm-6 / pm-45 deploy phase B 之 preserve 邏輯）|
| P4 | **DNS readiness**（GitHub Pages 端 DNS check）| n/a | ✅ 綠色 check（GitHub Pages settings 顯示「DNS check successful」）| GitHub repo → Settings → Pages（自動）| DNS D1–D9 已 propagate（每個記錄 `dig` 可返）| 每個 record 各自 propagate；P4 綠了才進 P5 |
| P5 | **Certificate state**（HTTPS 憑證）| n/a | ✅ 已簽發（Let's Encrypt；GitHub Pages settings 顯示 certificate 生效）| GitHub 自動（不需 Dean 操作）| P4 已通過 + DNS 未 proxy（見 §6.2）| GitHub Docs: `If you're using Certification Authority Authorization (CAA) records, at least one CAA record must exist with the value letsencrypt.org for your site to be accessible over HTTPS.` |
| P6 | **Enforce HTTPS state** | n/a | ✅ 勾 checkbox | GitHub repo → Settings → Pages | P5 已通過（P5 未成則 checkbox 灰）| GitHub Docs: `It can take up to 24 hours before this option is available` |
| P7 | **Expected redirects** | n/a | HTTP → HTTPS auto、`www.babel-lab.net` → `babel-lab.net` auto、legacy `babel-lab.github.io/portable-blog-system/*` → `babel-lab.net/*` auto | GitHub 自動 | P2 + P5 + P6 | 需以 `curl -I` 驗證（見 §9.14）|

**P1 vs P2 之順序**：GitHub Docs 官方 `Verifying your custom domain for GitHub Pages` 明列 verification **可**於 add custom domain 之後執行（不強制先 verify），但實務上**先 verify** 較穩：verification 於 profile-level 保護「其他 GitHub user 於未來 wipe / typo 場景下 hijack 網域至他人 Pages 站」。本 doc 建議 **P1 先於 P2**（見 §7 Stage 2 Step 4 / Step 6）。

---

## 7. Two-stage execution plan

### 7.1 Stage 1：2026-08-01 registration-only

**前提**：Dean 於當日 explicit approval「進 Stage 1」；本 doc **不**代 Dean 決策啟動。

| Step | 操作 | 執行者 | 前置 | 產物 / 驗證 | Rollback |
| --- | --- | --- | --- | --- | --- |
| S1.1 | 於 Cloudflare Registrar 後台檢查 `babel-lab.net` 之 availability + 當時實際價格 | Dean 手動 | Cloudflare account exist | availability = available；價格於 Dean 可接受範圍 | 若不可註冊 / 價格不接受，abort；不進 S1.2 |
| S1.2 | 註冊 `babel-lab.net`（信用卡完成付款）| Dean 手動 | S1.1 通過 + Dean 明確確認要買 | Registrar = Cloudflare；WHOIS redacted by default（per `developers.cloudflare.com/registrar/`）；zone 於 Cloudflare Dashboard 出現 | 30 天內可 refund（依 Cloudflare Registrar 政策；Dean 於後台自查當下實際條款）|
| S1.3 | 於 Cloudflare Registrar 後台記錄 Registrar / renewal date（1 year default）/ WHOIS privacy 狀態 / assigned nameservers / DNSSEC 狀態（default：**未** enable）| Dean 手動 | S1.2 完成 | 於本 doc 之 §Post-Stage-1 log（future slice）記錄 | n/a |
| S1.4 | **不**啟用 DNSSEC（暫緩至 P5 / P6 完成後）| Dean 手動 | S1.2 完成 | DNSSEC = disabled at Cloudflare Registrar（default 已為此狀態）| n/a |
| S1.5 | **不**建立任何 DNS record（zone 保持 empty，僅 Cloudflare 預設 NS record）| Dean 手動 | S1.2 完成 | Cloudflare DNS Dashboard 之 `babel-lab.net` zone 內 records = 只有 NS + 自動 SOA | n/a |
| S1.6 | **不**在 repo 端做任何改動（不改 `site.config.json`、不改 `github-deploy.md`、不建 `CNAME`、不 build、不 deploy）| Claude 不代 Dean 執行；Dean 亦不執行 | S1.2 完成 | source repo working tree 保持 clean at `cb42449`（或後續本 doc commit 對應之 HEAD）；deploy repo `0eaf9c6` 不動 | n/a |
| S1.7 | Stage 1 完成、進 idle | Dean 手動決定 | S1.1–S1.6 完成 | Dean 觀察 GitHub Pages 現行 project-site URL 仍正常（未受 domain 註冊影響）；GA4 / AdSense / Blogger 主收益完全不動 | 若要 rollback：於 Cloudflare Registrar 30 天內 refund |

**Stage 1 完成後之預期狀態**：
- `babel-lab.net` 已註冊、Dean 名下、Cloudflare Registrar、WHOIS redacted、Cloudflare 為 DNS provider、zone empty（除 NS + SOA）、DNSSEC disabled
- GitHub Pages 現行 project-site URL（`babel-lab.github.io/portable-blog-system/`）100% 未受影響、live 中
- Source / deploy repo 未動
- GA4 / AdSense / Blogger 主收益 100% 未受影響

**Stage 1 → Stage 2 之 gate**：Dean 於未來另一 Session 明確聲明「進 Stage 2 cutover」；Claude 不因 Stage 1 完成而自動連動。

### 7.2 Stage 2：Custom-domain cutover

**前提**：
- Stage 1 已完成
- 本 doc §11 之「Next authorized slice」（deploy wipe pattern preserve `CNAME`）已於 Dean explicit approval 下獨立 slice 完成 + commit + push
- Dean 於當日 explicit approval「進 Stage 2 cutover」

**Cutover 順序**（有序、避免 certificate deadlock / DNS 空窗 / `CNAME` 被 wipe）：

| Step | 操作 | 執行者 | 前置 | 預期時長 | 驗證 | Rollback |
| --- | --- | --- | --- | --- | --- | --- |
| S2.1 | 前置 repo change：改 `content/settings/site.config.json` `githubSiteUrl` = `"https://babel-lab.net"` | Claude 於 Dean explicit approval 之新 slice | 本 doc + `docs/github-deploy.md` §5.4 之 preserve-CNAME 修正皆已 landed | ~1 分鐘 edit + local `npm run build` + `npm run build:sitemap` local verify | dist HTML canonical / og:url / JSON-LD `@id`/`url` / sitemap `<loc>` / robots `Sitemap:` 皆 `https://babel-lab.net/...`；basePath = ''（root-relative internal links 正常）| `git revert` source commit 即回退 |
| S2.2 | commit source change | Claude | S2.1 完成 | ~30 秒 | `git status` clean；HEAD 前進一 commit | `git revert` |
| S2.3 | push origin/main | Claude | S2.2 完成 | ~30 秒 | `git rev-list --left-right --count origin/main...HEAD` = 0/0 | `git push --force` 於 rollback 需 Dean explicit approval（本 doc 不預設）|
| S2.4 | GitHub domain verification：Dean 於 GitHub profile settings 「Verified domains」加 `babel-lab.net` → 取得 challenge → 於 Cloudflare DNS 建 D10 TXT → 點 verify | Dean 手動 | S2.3 完成（或提前；此 step 對 source repo 中立） | ~5–30 分鐘（DNS propagate）| GitHub profile settings 顯示 `babel-lab.net verified ✓` | 刪除 D10 TXT → verification lapse；於 profile 端 remove domain |
| S2.5 | DNS record establishment：Dean 於 Cloudflare DNS 建 D1–D9（apex A×4 + AAAA×4 + `www` CNAME），全部 **DNS-only（gray cloud）** | Dean 手動 | S2.4 完成（或平行）| ~5 分鐘 create + 5–30 分鐘 propagate | `dig +short babel-lab.net A` = 上述 4 IP；`dig +short babel-lab.net AAAA` = 上述 4 IPv6；`dig +short www.babel-lab.net` = `babel-lab.github.io.` | 刪除記錄；DNS 恢復未指向 GitHub Pages |
| S2.6 | **build + deploy** with 新 `site.config.json`：`npm run build` → `npm run build:sitemap` → 於 deploy clone 執行 preserve-`CNAME` 版本之 wipe → `cp -r dist/* .` → `touch .nojekyll` → **手動於 deploy root 建 `CNAME` 檔（單行：`babel-lab.net`）** → `git add .` → `git commit -m "deploy(github): cutover to babel-lab.net"` → `git push origin/gh-pages` | Claude 於 Dean explicit approval 之新 slice | S2.3 + S2.5 propagated | ~5 分鐘 build + ~2 分鐘 deploy | deploy commit 中 `CNAME` 存在單行 `babel-lab.net`；dist HTML canonical 已帶新 hostname；`.nojekyll` 存在 | `git revert` deploy commit（保留 `CNAME` 之 revert 需個案處理）|
| S2.7 | Pages custom-domain setting：Dean 於 deploy repo Settings → Pages → Custom domain 填 `babel-lab.net` → Save；GitHub Pages **可能**自動於 gh-pages branch root 建 `CNAME`（若 S2.6 已建，內容一致）| Dean 手動 | S2.4（verify）+ S2.5（DNS）+ S2.6（deploy 含 CNAME）| ~1 分鐘 | GitHub Pages settings 顯示「DNS check successful」（P4 綠）| 於 Settings → Pages → Custom domain 清空 |
| S2.8 | Certificate 等待：等 Let's Encrypt 憑證簽發 | GitHub 自動 | S2.5 propagated + S2.7 完成 + DNS **非 proxied** | 官方：`may take some time`；社群觀察 5–30 分鐘常見；GitHub Docs 明列「Enforce HTTPS 可能 up to 24 hours 才 available」 | GitHub Pages settings 顯示 certificate 已就緒；`curl -Iv https://babel-lab.net/` 之 TLS handshake 返 Let's Encrypt cert | 若卡住：`Remove` custom domain → 等一陣 → 重新 add（GitHub Docs 官方 troubleshooting 建議）|
| S2.9 | Enforce HTTPS：Dean 於 Pages settings 勾 `Enforce HTTPS` checkbox | Dean 手動 | S2.8 通過 | ~1 分鐘 | GitHub Pages settings 顯示 `Enforce HTTPS` 已勾；`curl -Iv http://babel-lab.net/` 返 301 至 `https://` | 取消勾（不建議；HTTPS 是 baseline）|
| S2.10 | Canonical / sitemap / robots 驗證（`curl` 頁面 + sitemap.xml + robots.txt）| Claude（read-only smoke on live URL）| S2.9 完成 | ~2 分鐘 | 頁面 canonical / og:url / JSON-LD 全 apex；sitemap `<loc>` 全 apex；robots `Sitemap:` = `https://babel-lab.net/sitemap.xml` | Dean 觸發 rollback |
| S2.11 | GA4 手動 acceptance：Dean 於 GA4 後台改 Data Stream Website URL = `https://babel-lab.net/`；於 Realtime / DebugView 觀察來自 `babel-lab.net` 的 event | Dean 手動 | S2.9 完成 | ~10 分鐘 GA4 後台 + 觀察 | Realtime 之 hostname dimension 顯示 `babel-lab.net`；event flow 未斷 | GA4 Data Stream URL 改回；不影響 measurementId 之延續性 |
| S2.12 | Search Console：Dean 於 GSC 加 `babel-lab.net` domain property（用 DNS TXT verify）+ submit 新 sitemap `https://babel-lab.net/sitemap.xml`；可選：於 legacy property `babel-lab.github.io/portable-blog-system/` submit `Change of Address` | Dean 手動 | S2.9 完成 | GSC verify ~5 分鐘；Change of Address ~1 分鐘 | GSC 顯示 property verified + sitemap accepted | 移除 property |
| S2.13 | Stable-state confirmation：24–72 小時觀察 GA4 / GSC / uptime；`curl -I` 確認 apex + www + legacy `github.io` URL 之 redirect 皆穩定 | Dean 手動 | S2.12 完成 | 24–72 小時 | 無 5xx / 憑證 warning / DNS 錯誤；redirect 行為與 §4 一致 | 若 stable-state 異常 → 依 §10 rollback |

**Cutover 之時窗**（zero-downtime 之關鍵）：DNS propagate + certificate provisioning 於 GitHub Docs 為 `may take some time` / 官方 `up to 24 hours` for Enforce HTTPS 可用。Cutover 完成前，legacy `babel-lab.github.io/portable-blog-system/` 仍可達 —— 直到 P2（Pages custom domain 設定）觸發 auto-301。因此 **cutover 期間網站不會斷**；只有「新 URL 可用之前，舊 URL 仍為 canonical」→「新 URL 可用之後，舊 URL 301 至新 URL」。

**避免 certificate deadlock 之關鍵**：
- P2 之前 DNS D1–D9 必須已 propagate；否則 GitHub Pages 之 DNS check 不過、certificate 不 queue
- D1–D9 於 cutover **必須為 DNS-only（gray cloud）**；proxied 會讓 GitHub 看到 Cloudflare IP 而非 Let's Encrypt 對外 challenge 之期望 IP，可能導致 certificate 無法簽發（GitHub Docs 未逐字明言此互動；但 GitHub Docs 明列 `Any additional A, AAAA, ALIAS, ANAME records with the @ host ... may prevent the HTTPS certificate from generating` → 若 proxied，DNS 端返 Cloudflare 之 A 記錄實質上多了 additional record 語意；為避免 gray zone，本 doc **鎖定** cutover 期間 DNS-only）
- 若 Dean 之後要試 proxied，**須**於 Stable-state 之後另開獨立 phase + 監控 certificate renewal

**避免 `CNAME` 被 deploy wipe 之關鍵**：本 doc §11 之 `custom-domain-prep-0`（deploy pattern 修正）**必須**於 S2.6 之前完成 + commit + push；否則 S2.6 之後首次 subsequent deploy 就會 wipe `CNAME` → domain 中斷。

---

## 8. Zero-downtime / low-risk strategy

**可提前完成之事**（Stage 1 完成後、Stage 2 前之空窗）：
- Cloudflare Registrar 之 zone 靜置（無 DNS record，不影響任何服務）
- Dean 於 Cloudflare Dashboard 熟悉 UI、記錄 nameservers、決定 TTL 值
- Source repo 之 §11 `custom-domain-prep-0`（deploy wipe 修正）可**先**於獨立 slice 完成 + push；此 slice 不 depend on domain / DNS / GitHub Pages
- 撰寫 Dean 之 cutover-day operator manual（本 doc 之 §7 之進一步操作化）

**必須同一天完成之事**（Stage 2 cutover day）：
- S2.4 verify + S2.5 DNS + S2.6 deploy + S2.7 Pages setting + S2.8 certificate + S2.9 Enforce HTTPS
（有序 chain，避免 D1–D9 已建但 P2 未設造成長時間 legacy URL / 新 URL 不一致）

**舊 GitHub Pages URL 於切換期間如何維持**：
- Stage 1 期間：完全未改；100% 正常
- Stage 2 S2.1–S2.7 期間：source `githubSiteUrl` 已改為 apex，但 deploy 未跑 → live artifact 仍為 legacy；legacy URL 100% 正常
- S2.6 deploy 完成之後、S2.7 P2 設定之前：deploy 已為新 hostname、但 GitHub Pages custom domain 未設 → **legacy URL 仍指向 project-site**（GitHub Pages 未 auto-redirect），但頁面內 canonical / og:url 已為 apex；此為短暫的 canonical 不一致，Dean 應**盡快**執行 S2.7
- S2.7 之後：GitHub Pages auto-redirect legacy → apex

**DNS TTL 策略**：
- Stage 2 前 24–48 小時：不預先設 low TTL（因 zone 尚無 record）
- Stage 2 S2.5 建 D1–D9 時：使用 Cloudflare default TTL（`Auto`）；`Auto` 於 Cloudflare 為 5 分鐘 proxied 或 300s DNS-only（依 record type）
- Cutover 完成、stable state 24 小時後：可視需要調高 TTL 至 1 小時 / 1 天（節省 DNS query 成本；對 Cloudflare 免費層無實質成本，可保留 Auto）
- Rollback 之考量：TTL 過短 → rollback 生效快；TTL 過長 → rollback 需等舊 record 過期。cutover 期間保持 short TTL 為 rollback friendly。

**Certificate 尚未完成時的處置**：
- GitHub Pages settings 顯示 certificate 待完成時，**不勾 Enforce HTTPS**（勾了會失敗 / disable UI 灰）
- 期間 `https://babel-lab.net/` 可能返 TLS handshake failure（正常；等 provisioning）
- `http://babel-lab.net/` 於此期間**可能**已可返 GitHub Pages 內容（無 TLS）；建議 Dean **不**在此期間公開新 URL、以免用戶存 book mark 到 http scheme
- 若 15 分鐘後仍未簽發：於 Pages settings 執行 `Remove`（清除 custom domain）→ 等 5 分鐘 → 重 add；GitHub Docs 明列此 troubleshooting 動作

**Cloudflare proxy 切換時機**：
- Stage 2 全程：**DNS-only（gray cloud）**（本 doc 鎖定）
- Cutover + stable state 至少 7 天之後：Dean **若**要試 proxied（orange cloud），須另開獨立 phase，逐 record 切；切之前備份 certificate 狀態；切後 monitor certificate renewal
- 本 doc **不建議**首個 cutover 就開 proxied（多變因、certificate renewal 未驗證）

**不可同時做的動作**：
- 不可同時 enable DNSSEC + cutover DNS（DNSSEC 於 DS TTL 期間對 DNS 變更敏感；`developers.cloudflare.com/dns/dnssec/` 明列 `If you change nameservers before the old DS TTL has fully expired, validating resolvers will return SERVFAIL`）
- 不可同時切 DNS + push force gh-pages（風險 amplification）
- 不可同時改 GA4 measurementId + 切 domain（本 doc 不動 measurementId）
- 不可同時申請 AdSense + cutover（Gate A 與 Gate D 屬獨立 gate、順序建議 D → 穩定 → A；`docs/20260710-custom-domain-adsense-trigger-checklist.md` §4）
- 不可同時 unquarantine `github-pages-blog-planning` + cutover
- 不可同時 push Blogger backfill 寫入 + cutover

---

## 9. Verification checklist（可執行、read-only）

以下指令皆為 read-only；不修改任何線上狀態。Dean 於 cutover 前 / 中 / 後皆可執行。

### 9.1 NS
```bash
dig +short NS babel-lab.net
# 預期：Cloudflare assigned nameservers（.ns.cloudflare.com 結尾兩筆）
```

### 9.2 TXT (verification)
```bash
dig +short TXT _github-pages-challenge-babel-lab.babel-lab.net
# 預期：GitHub issue 之 challenge token（字串）
```

### 9.3 Apex A / AAAA
```bash
dig +short A    babel-lab.net
# 預期集合：185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153
dig +short AAAA babel-lab.net
# 預期集合：2606:50c0:8000::153 / 2606:50c0:8001::153 / 2606:50c0:8002::153 / 2606:50c0:8003::153
```

### 9.4 www CNAME
```bash
dig +short CNAME www.babel-lab.net
# 預期：babel-lab.github.io.
```

### 9.5 CAA
```bash
dig +short CAA babel-lab.net
# 預期：空（無 CAA）或包含 `0 issue "letsencrypt.org"`
# 絕不預期：包含其他 CA 但不含 letsencrypt.org
```

### 9.6 nslookup 交叉驗證
```bash
nslookup babel-lab.net
nslookup www.babel-lab.net
```

### 9.7 HTTP / HTTPS + apex
```bash
curl -I http://babel-lab.net/
# 預期：301 → https://babel-lab.net/（Enforce HTTPS 生效後）
curl -I https://babel-lab.net/
# 預期：200；X-Served-By 或 Server: GitHub.com；HTTP/2 常見
```

### 9.8 HTTP / HTTPS + www redirect
```bash
curl -I http://www.babel-lab.net/
# 預期：301 → https://babel-lab.net/
curl -I https://www.babel-lab.net/
# 預期：301 → https://babel-lab.net/
```

### 9.9 Legacy github.io URL
```bash
curl -I https://babel-lab.github.io/portable-blog-system/
# 預期（cutover 完成後）：301 → https://babel-lab.net/
# 若無 301：非 blocking；Google 自然 de-dup（見 §4）
```

### 9.10 Certificate SAN / 有效期
```bash
openssl s_client -connect babel-lab.net:443 -servername babel-lab.net < /dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
# 預期：issuer 含 Let's Encrypt；SAN 含 babel-lab.net + www.babel-lab.net；notAfter 為未來 90 天內（LE 週期）
```

### 9.11 頁面 canonical / og:url / JSON-LD
```bash
curl -s https://babel-lab.net/ | grep -E 'rel="canonical"|og:url|@id'
# 預期：全部 https://babel-lab.net/（root）
curl -s https://babel-lab.net/posts/we-media-myself2/ | grep -E 'rel="canonical"|og:url|@id'
# 預期：全部 https://babel-lab.net/posts/we-media-myself2/
```

### 9.12 robots / sitemap / feed
```bash
curl -s https://babel-lab.net/robots.txt | head -10
# 預期：Sitemap: https://babel-lab.net/sitemap.xml
curl -s https://babel-lab.net/sitemap.xml | grep -oE '<loc>[^<]*</loc>' | head -10
# 預期：全部 https://babel-lab.net/... 起頭
# feed / RSS / Atom：本專案未產出，不驗
```

### 9.13 CSS / JS / image assets
```bash
curl -s https://babel-lab.net/ | grep -oE 'href="[^"]*\.css"|src="[^"]*\.(js|png|jpg|svg|webp)"' | head -10
# 預期：root-relative（如 assets/entry-*.css）；basePath = '' 生效
curl -I https://babel-lab.net/assets/entry-*.css   # 手動代入實際 hash 檔名
# 預期：200
```

### 9.14 404
```bash
curl -I https://babel-lab.net/this-path-does-not-exist
# 預期：404；返 dist/404.html
```

### 9.15 GA4 tag presence（HTML source-level）
```bash
curl -s https://babel-lab.net/ | grep -E 'gtag|G-[A-Z0-9]{10}'
# 預期：現有 GA4 tag 存在（tag 本身不 mask；本 doc 不寫出 measurement ID）
```

### 9.16 GA4 Realtime / DebugView（Dean 手動）
- GA4 → Realtime → hostname dimension → 預期看到 `babel-lab.net`
- GA4 → DebugView → 於瀏覽器開 `https://babel-lab.net/?dtag_debug` → 預期 events flow
- （Dean 手動；Claude 不登入 GA4）

### 9.17 Search Console（Dean 手動）
- GSC → property `babel-lab.net` → Sitemaps → 檢查 sitemap accepted
- GSC → Coverage → 24–72 小時後檢查 apex URL 開始被 index
- （Dean 手動；Claude 不登入 GSC）

---

## 10. Rollback plan

**Golden rule**：**Git revert 與 DNS rollback 是兩件事，不可混談**。git revert 只回退 source repo；DNS 回退需於 Cloudflare DNS 端手動操作；GitHub Pages custom domain 回退需於 repo Settings → Pages 端手動操作。三者互相**不自動連動**。

### 10.1 DNS rollback（於 Cloudflare DNS 端；Dean 手動）
- 刪除 D1–D9（apex A×4 + AAAA×4 + `www` CNAME）
- 保留 D10（domain verification TXT；rollback 完仍宜留，避免 hijack 風險；未來若再啟動 cutover 可省 verify）
- 效果：apex + `www` NXDOMAIN；用戶開 `babel-lab.net` 拿 DNS 錯誤

### 10.2 GitHub Pages custom-domain removal（於 Pages settings 端；Dean 手動）
- Settings → Pages → Custom domain → 清空 → Save
- 效果：GitHub Pages 停止 auto-301 legacy → apex；legacy `babel-lab.github.io/portable-blog-system/` 恢復為 canonical

### 10.3 Deploy `CNAME` rollback（於 deploy repo 端；Claude 於 Dean explicit approval 之 slice）
- `rm CNAME` on gh-pages → commit -m "deploy(github): rollback custom domain CNAME" → push origin/gh-pages
- 或於本次 deploy commit 執行 `git revert <commit>`

### 10.4 Site config rollback（於 source repo 端；Claude 於 Dean explicit approval 之 slice）
- `git revert` `content/settings/site.config.json` 之 `githubSiteUrl` 改動 → source push origin/main
- 之後 `npm run build` + `npm run build:sitemap` + `deploy` → dist HTML canonical 回 legacy

### 10.5 Canonical / sitemap / robots rollback
- 為 10.4 之副作用；一次 build + deploy 完成
- 期間 legacy `babel-lab.github.io/portable-blog-system/` 於 GitHub Pages settings 未清 custom domain 前**仍**被 auto-301 → 若 10.2 未先做，10.4 + 10.5 之效果會被 GitHub Pages redirect 遮蔽

### 10.6 Cloudflare proxy rollback（若 stable-state 之後試過 proxied）
- 於 D1–D9 各 record 切回 gray cloud（DNS-only）
- 效果：Cloudflare 停止 proxy；DNS query 回原生 GitHub IPs；TLS chain 從 Let's Encrypt 端提供

### 10.7 HTTPS 尚未簽發時 rollback
- Pages settings → Custom domain → `Remove` → 清空
- 於 Cloudflare DNS 刪 D1–D9
- 保留 D10 TXT（same as 10.1）
- 效果：cutover 尚未 activate；legacy 100% 正常

### 10.8 如何確認回到原 `github.io` 狀態
```bash
curl -I https://babel-lab.github.io/portable-blog-system/
# 預期：200；X-Served-By: GitHub.com；HTTP/2；無 301
curl -I https://babel-lab.net/
# 預期（DNS rollback 後）：DNS lookup failure / NXDOMAIN
```
- Dean 於 GSC + GA4 觀察 legacy URL 流量正常
- Dean 於 GitHub repo Settings → Pages → Custom domain 為空

**Rollback 相依性**（有序、避免 stuck state）：
1. 10.2（GitHub Pages custom-domain 清空）**先**於 10.1（DNS 刪除）；避免 GitHub Pages 仍嘗試以 custom domain serve、但 DNS 已 gone
2. 10.4 / 10.5（source revert + build + deploy）可獨立於 10.1 / 10.2；但 10.3（deploy CNAME 移除）**應**於 10.2 之後、或於 10.2 之前但確認 GitHub Pages settings 已清

---

## 11. Exact next authorized slice

本 doc 之下一 slice 為**單一目的**：修正現行 deploy runbook + checklist，使 wipe pattern preserve `CNAME` 檔（同 `.nojekyll`）。此 slice **必須**於 Stage 2 cutover 之前完成、且**必須**於 Dean 明確 approval 下啟動。

### 11.1 Slice 目標

讓 deploy runbook 明列 `CNAME` 檔為 preserve list 成員；讓 checklist 對應勾選項一致。

### 11.2 Exact files & values

| File | Line 位置 | Current | Proposed |
| --- | --- | --- | --- |
| `docs/github-deploy.md` §5.3 line 165–177 | `git rm -rf .` + `cp -r ../portable-blog-system/dist/* .` + `touch .nojekyll` | `git rm -rf .`（首次 orphan gh-pages）| 首次無 CNAME 檔可 preserve；此段可加註釋「首次 orphan 之後、cutover 完成 + 建 CNAME 後，後續 §5.4 之增量 deploy 之 wipe **必須** preserve CNAME」 |
| `docs/github-deploy.md` §5.4 line 184–192 | `rm -rf ./*` → `cp -r ../portable-blog-system/dist/* .` → `touch .nojekyll` | 同左 | `find . -mindepth 1 ! -name '.git' ! -name '.nojekyll' ! -name 'CNAME' -exec rm -rf {} +` → `cp -r ../portable-blog-system/dist/* .` → `touch .nojekyll` |
| `docs/checklists/github-deploy-checklist.md` §4.4 | `[ ] §4.4 .nojekyll 空檔已建立` | 同左 | 保留現行 `.nojekyll` 勾選項；**新增**「§4.5 `CNAME` 檔（若已 custom domain）已 preserve、未被 wipe」勾選項 |

### 11.3 Expected generated-output changes

無（本 slice 純 docs edit；不改 build script、不改 source code、不改 build 產物）。

### 11.4 Required guards

- `check:blogger-preview-docs-status`
- `check:blogger-preview-plan`
- `check:build-blogger-preview`
- `check:docs-node-script-refs`
- `check:docs-npm-run-refs`
- `check:npm-script-targets`
- `check:phase1-readiness`
- `check:redraft-all`
- `validate:content`
- `git diff --check`

以上皆須沿本 doc 之 §Verification results 保持 PASS + frozen counts 不變（見 §Non-actions 之對照）。

### 11.5 Build / deploy needed?

- Build：**否**（純 docs edit）
- Deploy：**否**（純 docs edit；deploy 於 Stage 2 才需要）

### 11.6 Manual actions Dean must perform

- Dean explicit approval「進 `custom-domain-prep-0`（deploy wipe preserve CNAME）slice」

### 11.7 Rollback boundary

- 純 docs edit；`git revert` 即可完全回退
- 無線上狀態變更、無 build artifact 變更、無 DNS 變更

---

## 12. Explicit non-actions

本 session **未做**以下任何一項（cumulative；違反則 abort）：

| 項目 | 狀態 |
| --- | --- |
| No domain purchase / registration | ✅ 未做 |
| No Cloudflare login / write | ✅ 未做 |
| No DNS write / DNS record create / DNS record modify / DNS record delete | ✅ 未做 |
| No nameserver change | ✅ 未做 |
| No DNSSEC change（enable / disable / DS record modify）| ✅ 未做 |
| No GitHub account domain verification（profile-level）| ✅ 未做 |
| No GitHub Pages setting change（source branch / custom domain / Enforce HTTPS / private Pages）| ✅ 未做 |
| No `CNAME` creation in deploy repo（含 placeholder / fake）| ✅ 未做 |
| No `CNAME` creation in source repo `public/` | ✅ 未做 |
| No source config change（`content/settings/site.config.json` / 其他 `content/settings/*.json`）| ✅ 未做 |
| No `src/**` code change | ✅ 未做 |
| No `views/**` change | ✅ 未做 |
| No `package.json` / `package-lock.json` change | ✅ 未動 |
| No build（`npm run build` / `build:github` / `build:blogger` / `build:blogger-preview` / `build:promotion` / `build:sitemap` / `build:blogger-theme`）| ✅ 未做 |
| No deploy / gh-pages write / gh-pages push | ✅ 未做 |
| No preview（`npm run preview`）/ dev server（`npm run dev`）| ✅ 未做 |
| No Blogger write（無 API 呼叫、無後台操作、無登入）| ✅ 未做 |
| No GA4 write / GA4 backend operation / GA4 login | ✅ 未做 |
| No Search Console write / GSC login / GSC verify / GSC sitemap submit | ✅ 未做 |
| No AdSense write / AdSense application / AdSense config change / `ads.txt` create | ✅ 未做 |
| No content status change（無 `status` / `draft` 變動）| ✅ 未做 |
| No `.publish.json` write（無 sidecar 建立 / 修改）| ✅ 未做 |
| No redraft（無 `admin:redraft-apply` / `admin:plan-redraft` 執行）| ✅ 未做 |
| No re-publish（無 Blogger repost / 無 GitHub Pages redeploy）| ✅ 未做 |
| No `CLAUDE.md` / `MEMORY.md` / `memory/**` change | ✅ 未做 |
| No `dist*/` write | ✅ 未做 |
| No `.cache/` write | ✅ 未做 |
| No B1 preview navigator change | ✅ 未做（B1 仍 read-only）|
| No B2 draft preview change（無 renderer / planner / builder / docs cleanup / guard change / dist-blogger-preview contract change）| ✅ 未做（B2 CLOSED）|
| No Blogger backfill 語意變更（`check:blogger-backfill` 仍 report-only）| ✅ 未做 |
| No Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` 猜測或填入 | ✅ 未做 |
| No `admin:write` / `backfill:url` / `safe-write:test` 執行 | ✅ 未做 |
| No Phase 1 final 之降級 / 重新封存 | ✅ 未做 |
| No GA4 measurement ID 暴露於本 doc / 其他 docs | ✅ 未做（本 doc 僅以 `G-[A-Z0-9]{10}` 之 grep 模式引用；不寫入完整 ID）|
| No AdSense client id / slot id 暴露於本 doc / 其他 docs | ✅ 未做 |
| No Cloudflare API token / GitHub token / credential 暴露 | ✅ 未做 |
| No sensitive frontmatter 暴露 | ✅ 未做 |
| No `dist-blogger-preview/` 出現 | ✅ 驗證 absent |
| No index.lock 出現 | ✅ 驗證 absent |

---

## See also

- `docs/20260710-custom-domain-adsense-trigger-checklist.md`（Gate D / Gate A 分離；trigger conditions；本 doc 為此 doc 之 operational preflight 之一）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 決策盤點；本 doc 之上位）
- `docs/custom-domain-root-files-strategy.md`（`CNAME` / `ads.txt` / `robots.txt` / `sitemap.xml` 遷移機制；§3.3 CNAME 之 no-placeholder）
- `docs/github-deploy.md` §5 / `docs/checklists/github-deploy-checklist.md` §4.4（本 doc §11 之目標 slice 檔案）
- `docs/content-platform-routing.md` §5（custom domain migration 影響）
- `docs/publish-workflow.md` §3（build 流程）
- CLAUDE.md §2.2（GitHub Pages 定位）/ §16.4（Blogger ↔ GitHub cross-link UTM）/ §21（SEO / canonical）/ §24（Blogger 發布 URL）/ §3a Red lines
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）

**官方查證來源（2026-07-18 accessed）**：
- GitHub Docs, `Managing a custom domain for your GitHub Pages site` — https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Docs, `Verifying your custom domain for GitHub Pages` — https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- GitHub Docs, `Troubleshooting custom domains and GitHub Pages` — https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages
- GitHub Docs, `Securing your GitHub Pages site with HTTPS` — https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- Cloudflare Docs, `Cloudflare Registrar` — https://developers.cloudflare.com/registrar/（Last updated 2026-04-24）
- Cloudflare Docs, `Proxy status` — https://developers.cloudflare.com/dns/proxy-status/（Last updated 2026-04-21）
- Cloudflare Docs, `CNAME flattening` — https://developers.cloudflare.com/dns/cname-flattening/
- Cloudflare Docs, `DNSSEC` — https://developers.cloudflare.com/dns/dnssec/

**本 doc 之非官方判斷**（明列以供 Dean 於 cutover 前再核對）：
- Cloudflare orange cloud（proxied）於 GitHub Pages 前是否會干擾 certificate provisioning：**GitHub Docs 與 Cloudflare Docs 均未明列此互動**；本 doc 依「保守 default = DNS-only during cutover」處理。若 Dean 之後要 proxied，須另開獨立 phase + 現場 verify certificate renewal。
- Legacy `babel-lab.github.io/portable-blog-system/*` → apex 之 auto-301 之詳細條件：GitHub Docs troubleshooting 之敘述為 general context；cutover 當日以 `curl -I` 現場驗證（見 §9.9）。

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / write helper；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未動 Cloudflare / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`；未動 GA4 config；未動 `site.config.json`；未動 deploy pattern（本 doc §11 為下一 slice 之目標、非本 doc 執行）。

---

（本文件結束 / end of document）
