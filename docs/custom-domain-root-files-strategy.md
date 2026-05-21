# Custom Domain Root Files Safety Strategy

本文件為 **Phase 20260521 custom-domain-root-files-safety-a** 之 docs-only 落地；記錄 GitHub Pages 自訂網域導入前之**靜態根目錄檔案安全策略**。

⚠️ **本階段不啟用新網域 / 不改 DNS / 不改 GitHub Pages settings / 不部署假資料**。

對應上層：
- `docs/content-platform-routing.md` §5（custom domain migration impact）
- `docs/20260521-end-of-day-report.md` §16.6 / §18.3 / §18.4（custom domain 屬未來；預計 5 月底 / 6 月初啟動）
- `vite.config.js`（vite 自動將 `public/*` 複製至 `dist/` 根目錄；本策略需與 build-sitemap.js 之既有自動產生機制協調）
- `src/scripts/build-sitemap.js`（postbuild 自動產生 `dist/sitemap.xml` + `dist/robots.txt`）

---

## §1 Purpose

GitHub Pages 自訂網域導入時需要新增以下根目錄檔案：
- `CNAME`（GitHub Pages 之 custom domain 設定檔；放於 deploy repo 之 gh-pages 根目錄）
- `ads.txt`（Google AdSense 之 publisher 驗證檔；放於網站根目錄）
- `robots.txt`（搜尋引擎爬蟲規則；含新 Sitemap URL）
- `sitemap.xml`（搜尋引擎索引；含新 base URL）

本策略**預先規劃**這些檔案之來源與生成方式；避免：
- 部署錯誤 / 假資料（如 fake AdSense pub id）
- 多源衝突（vite public/* vs build-sitemap.js）
- 新網域上線時臨時忙亂 / 漏檔

---

## §2 Current state（2026-05-21 pm 盤點）

### 2.1 `public/` 目錄結構

```
public/
├── downloads/   （教具下載素材；既有）
├── favicon/     （favicon assets；既有）
├── icons/       （icon assets；既有）
└── images/      （image assets；既有）
```

**根目錄無檔案**（無 `robots.txt` / `ads.txt` / `CNAME` / `sitemap.xml`）。

### 2.2 `dist/` 根目錄（`npm run build` 後）

| 檔案 | 來源 | 機制 |
|---|---|---|
| `404.html` | vite build（從 `.cache/pages/404.html`）| vite 自動 |
| `index.html` | vite build（從 `.cache/pages/index.html`）| vite 自動 |
| `assets/` | vite build（含 hashed JS / CSS）| vite 自動 |
| `posts/` / `categories/` / `tags/` / `design-system/` | vite build（multi-page input）| vite 自動 |
| `downloads/` / `favicon/` / `icons/` / `images/` | **public/* 複製**（vite `publicDir`）| vite 自動 |
| **`robots.txt`** | `src/scripts/build-sitemap.js` 之 `buildRobotsTxt(baseUrl)` | **postbuild script** |
| **`sitemap.xml`** | `src/scripts/build-sitemap.js` 之 `buildSitemapXml(entries)` | **postbuild script** |

### 2.3 deploy repo（`gh-pages` branch；`D:/github/blog-new/portable-blog-deploy/`）

| 檔案 | 來源 | 備註 |
|---|---|---|
| `.nojekyll` | **deploy repo 唯一保留**（per pm-6 / pm-45 deploy phase B 之 `find ... ! -name '.nojekyll'` 保留邏輯）| 確保 GitHub Pages 不跑 Jekyll；對 `_assets/` 等底線目錄至關重要 |
| 其他 | dist/ 複製（pm-6 / pm-45）| 含 robots.txt / sitemap.xml / index.html 等 |

---

## §3 Strategy for each root file

### 3.1 `robots.txt` — 由 build-sitemap.js 自動產生（**不**加 public/）

**當前實作**（per `src/scripts/build-sitemap.js` line 62-71）：
```js
function buildRobotsTxt(baseUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /design-system/',
    'Disallow: /404.html',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}
```

`baseUrl` 派生自 `settings.site.githubSiteUrl`。

**策略**：
- ❌ **不**在 `public/robots.txt` 放 fallback（會被 postbuild script 覆蓋；徒增混淆）
- ✅ build-sitemap.js 動態帶 `baseUrl`；custom domain 上線時改 `githubSiteUrl` 即自動帶新 URL
- ✅ Disallow 規則維持（per CLAUDE.md §19 之 noindex 邊界）

**未來 custom domain 啟用時**：
- 改 `content/settings/site.config.json` `githubSiteUrl` 為新 domain
- `npm run build` 自動帶新 Sitemap URL 至 robots.txt

### 3.2 `ads.txt` — **不**創建 placeholder（等正式 AdSense pub id）

**理由**：
- AdSense 申請前無 publisher ID（格式：`pub-XXXXXXXXXXXXXXXX`）
- 假 pub id 部署到線上會造成 AdSense 爬蟲驗證失敗 / 違反政策風險
- 空 ads.txt 反而會造成 AdSense crawler error

**策略**：
- ❌ **不**於本階段建立 `public/ads.txt`
- ❌ **不**於本階段建立 `dist/ads.txt`（即使 placeholder）
- ✅ 記錄於本 docs（§4.2）；AdSense 申請通過後另開 phase
- ✅ AdSense 啟用 phase 之最小落地：放 `public/ads.txt` 含真實 `google.com, pub-XXXX..., DIRECT, f08c47fec0942fa0`（user 提供正式 pub id 後再寫）

### 3.3 `CNAME` — **不**創建（等新網域確定）

**理由**：
- 尚未取得 / 確認新網域
- 提早建立會誤導 GitHub Pages 設定（雖然只在 gh-pages root 起作用；但 source repo 可能也誤帶）
- 任何錯誤 domain 字串會 break GitHub Pages 之 DNS check

**策略**：
- ❌ **不**於 source repo 之 `public/CNAME` 建立
- ❌ **不**於 deploy repo gh-pages 之 `CNAME` 建立（直到 user 確認 domain）
- ✅ 記錄於本 docs（§4.3）；user 取得 domain 後另開 phase
- ✅ Custom domain 啟用 phase 之最小落地：先在 deploy repo gh-pages root 加 `CNAME`（單行：新 domain，如 `blog.example.com`）；commit + push gh-pages；GitHub Pages settings 端 enable custom domain；DNS provider 端設 A / CNAME records；等 TLS provisioning；最後勾 Enforce HTTPS

### 3.4 `sitemap.xml` — 由 build-sitemap.js 自動產生（**不**手動放 public/）

**當前實作**（per `src/scripts/build-sitemap.js` line 56-60 + 113-153）：
- urlset：home + post-list + post-detail（過濾 noindex）+ category-list + 各 category + tag-list + 各 tag
- 不輸出 changefreq / priority（per Phase 5-c 設計）

**策略**：
- ❌ **不**手動放 `public/sitemap.xml`（會被 postbuild script 覆蓋；徒增混淆）
- ✅ build-sitemap.js 動態帶 `baseUrl`；custom domain 上線時自動帶新 URL
- ✅ noindex 規則（per `docs/seo-indexing-rules.md` §3 / §6 SEO-2）維持

### 3.5 `.nojekyll` — deploy repo only

**策略**：
- ✅ deploy repo `gh-pages/.nojekyll`（既有；per pm-6 deploy phase B 之 `find ... ! -name '.nojekyll'` 保留邏輯）
- ❌ source repo `public/.nojekyll` **無需**（vite build 不會誤判 `_assets/` 為 Jekyll 處理；vite 沒有 Jekyll 機制）
- ⚠️ deploy phase B 之 wipe 邏輯**必須**保留 `.nojekyll`（否則 GitHub Pages 會跳 Jekyll → `_assets/` 等底線目錄被 strip → CSS / JS 404）

### 3.6 favicon / icons / images / downloads — public/* 既有

| 維度 | 狀態 |
|---|---|
| `public/favicon/` | 既有；vite 自動複製到 `dist/favicon/` |
| `public/icons/` | 同 |
| `public/images/` | 同 |
| `public/downloads/` | 同 |
| custom domain migration 影響 | ❌ 無（純靜態資源；不依賴 domain）|

---

## §4 Future custom domain migration checklist

### 4.1 Domain 申請階段（user 端；非 source change）

1. user 選定 domain（建議：簡短易記；對 SEO 友善）
2. DNS provider 註冊 / 確認可用
3. **不**立即在 GitHub Pages settings 設 custom domain；先完成 §4.2 之 source 端準備

### 4.2 Source repo 準備階段（minimal source change）

| Phase 候選 | 動作 | 風險 |
|---|---|---|
| custom-domain-prep-1 | 更新 `content/settings/site.config.json` 之 `githubSiteUrl` 為新 domain；`npm run build` 驗證 dist HTML 之 canonical / og:url / JSON-LD url / sitemap `<loc>` / robots Sitemap line 皆帶新 URL | 🟡 中（影響 SEO；deploy 後 Google 會看到新 URL）|
| custom-domain-prep-2 | source commit + push origin/main | 🟢 低 |

### 4.3 Deploy repo 準備階段

| Phase 候選 | 動作 | 風險 |
|---|---|---|
| custom-domain-prep-3 | **手動於 deploy repo gh-pages root** 新增 `CNAME` 檔（單行：新 domain）；commit + push origin/gh-pages | 🟡 中（GitHub Pages 自動 detect CNAME；觸發 DNS check）|
| custom-domain-prep-4 | DNS provider 設 A records（GitHub Pages IPs）或 CNAME record（指向 `babel-lab.github.io`）| 🟡 中（DNS 變動；TTL 期間可能舊新並存）|
| custom-domain-prep-5 | 等 GitHub Pages DNS check 通過 + TLS certificate provisioning（通常 5-30 分鐘）| 🟢 等待 |
| custom-domain-prep-6 | GitHub Pages settings 勾「Enforce HTTPS」 | 🟢 低 |
| custom-domain-prep-7 | Standard deploy（per pm-6 phase B pattern）；複製 dist → deploy repo（**保留 `.nojekyll` + `CNAME`**）；push gh-pages | 🟡 中（deploy phase B 之 `find ... ! -name '.git' ! -name '.nojekyll' ! -name 'CNAME'` 需多加 CNAME 排除）|

### 4.4 GA4 / SEO 後台同步

| Phase 候選 | 動作 |
|---|---|
| custom-domain-ga4-1 | GA4 後台 → Admin → Data Stream → 編輯 Website URL 為新 domain（measurementId `G-C77SMPF8VD` 不變）|
| custom-domain-gsc-1 | Google Search Console 新增 custom domain property + verify ownership（DNS TXT / HTML meta tag）+ submit 新 sitemap |
| custom-domain-blogger-redirect-1 | Blogger ↔ GitHub cross-link UTM 更新（per `docs/ga4-parameter-naming-registry.md` §4.3；hostname-only update；不改 utm convention）|

### 4.5 AdSense 申請（依賴 custom domain + HTTPS Enforce）

| Phase 候選 | 動作 |
|---|---|
| adsense-1 | AdSense 後台申請；綁定 custom domain |
| adsense-2 | 等審核通過（通常 1-7 天）|
| adsense-3 | 通過後取得 pub id（格式 `pub-XXXXXXXXXXXXXXXX`）|
| adsense-4 | 建立 `public/ads.txt`（真實 pub id；無 fake）|
| adsense-5 | （可選）整合 AdSense script + slot HTML 至 Blogger / GitHub Pages template；source commit + push + deploy |

### 4.6 hostname allowlist（依賴 GA4 啟用 + 觀察期）

| Phase 候選 | 動作 |
|---|---|
| hostname-allowlist-1 | 等 GA4 production 累積 1-2 週資料；GA4 後台 → hostname dimension filter；確認是否有 preview mode / localhost event 污染 |
| hostname-allowlist-2 | （若需要）source 端 `src/views/tracking/ga4.ejs` 加 runtime hostname check |

---

## §5 Boundaries（**本批 phase 之鎖定項**）

| 項目 | 狀態 |
|---|---|
| 不啟用新網域 | ✅ |
| 不改 GitHub Pages settings | ✅ |
| 不改 DNS | ✅ |
| 不部署錯誤 / 假 AdSense pub id | ✅ |
| 不建立 fake `CNAME`（避免誤導 DNS check）| ✅ |
| 不在 public/ 重複建 robots.txt / sitemap.xml（由 build-sitemap.js 自動產生）| ✅ |
| 不改 source/settings/build scripts | ✅ |
| 不 push / 不 deploy | ✅ |
| 不啟動 §4 任何 future phase | ✅ |

---

## §6 新網域正式啟用前還缺哪些值

| 缺項 | user 須提供 | 觸發 phase |
|---|---|---|
| **新 domain 字串**（如 `blog.example.com` / `xxx.com`）| ✅ user 須申請 + 確認 | custom-domain-prep-1 |
| **DNS provider access**（可設 A / CNAME records）| ✅ user 須有 DNS 管理權限 | custom-domain-prep-4 |
| **AdSense publisher ID**（格式 `pub-XXXXXXXXXXXXXXXX`）| ✅ AdSense 通過後取得 | adsense-3 / adsense-4 |
| **Google Search Console ownership verification 方法**（DNS TXT or HTML meta）| ✅ user 選擇 | custom-domain-gsc-1 |
| **Blogger cross-link reciprocal update**（pure docs / runtime）| ⏸ 不需 user 值；屬系統決策 | custom-domain-blogger-redirect-1 |

---

## §7 Cross-links

- `docs/content-platform-routing.md` §5（custom domain migration 影響細節）
- `docs/20260521-end-of-day-report.md` §16.6 / §18.3 / §18.4（custom domain 屬未來；既有 reference）
- `docs/ga4-parameter-naming-registry.md` §1 / §4.3（GA4 measurementId 永久共用 / cross-link UTM convention）
- `docs/ga4-enable-preflight.md`（GA4 enable 流程；含 Data Stream URL 更新提示）
- `src/scripts/build-sitemap.js`（既有 robots.txt + sitemap.xml 自動產生機制）
- `CLAUDE.md` §19（SEO；含 noindex 規則影響 sitemap exclusion）

---

（本文件結束）
