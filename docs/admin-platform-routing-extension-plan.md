# Admin Platform Routing Read-only Extension Plan

本文件為 **Phase 20260521-pm-55** 之 docs-only 落地；定義未來 Admin overview 之 platform routing read-only display 擴充計畫。屬規格參考 + 拆批 implementation plan；**本文件不修改 source / Admin UI / loader / build / dist / deploy**。

對應上層：
- `docs/content-platform-routing.md` §3（pm-49；12 個 Admin read-only 候選欄位）
- `docs/admin-1-completion-report.md` §13（既有 Admin overview 完成紀錄）
- `docs/admin-mvp-pre-analysis.md` / `docs/admin-2-write-pre-analysis.md`（Admin 原始設計）
- `docs/ga4-parameter-naming-registry.md` §4.1（FB UTM convention；utmPreviewUrl 派生依據）
- `src/views/admin/index.ejs`（既有 Admin UI；single file，含 inline style + EJS + JS）
- `src/scripts/load-admin-posts.js`（既有 loader；line 89-220 之 `toAdminView()` 為主要 derive 邏輯）

⚠️ **read-only only**；不啟動 Admin write；不啟動 schema migration；不影響 GitHub Pages production。

---

## §1 現有 Admin overview 架構摘要

per pm-54 §2 + pm-10 §2 + pm-31 / pm-34 之既有狀態：

| 維度 | 現況 |
|---|---|
| **Admin UI 檔** | `src/views/admin/index.ejs`（**單一檔案**；759 行；含 inline `<style>` + EJS render + inline JS）|
| **loader 檔** | `src/scripts/load-admin-posts.js`（251 行；`toAdminView()` 為主要 derive；扫 `content/{github,blogger}/posts/*.md`）|
| **stats cards** | 12 張（**不擴充**）|
| **列表表頭** | 7 欄（id+title / kind+status / category+tags / Blogger / GitHub / Completeness / URLs）；**不新增新欄**|
| **detail panel sections** | 10 + 2 dry-run editors；**規劃在 Identity 之後新增 1 個 Platform Routing section** |
| **dev-mode-only** | ✅ Admin 為 dev-mode-only（per `build-github.js --mode=dev` gating；prod build 不產出）；改 Admin **不影響線上 production** |
| **既有 read-only / dry-run safe 邊界** | ✅ 無 `<form>` / 無 fetch / 無 fs write / 無 Apply button；本擴充計畫**全程維持此邊界** |

---

## §2 欄位分級

### 2.A 已存在 / 已顯示（**5-6 個**；不需新增）

| 欄位 | 來源 | 既有顯示位置 |
|---|---|---|
| `category` | `.md` frontmatter | 列表 col 3 + detail Identity section |
| `tags` | `.md` frontmatter | 列表 col 3 + detail Identity section |
| `primaryPlatform` | `.md` frontmatter | detail Identity section |
| `publishTargets`（blogger.enabled / .mode + github.enabled / .mode）| `.md` frontmatter | 列表 col 4 / col 5 + detail Blogger / GitHub channel |
| `bloggerStatus`（`blogger.status`）| `.publish.json` | detail Blogger channel |
| 部分 `finalUrl / platformUrl`（`blogger.publishedUrl` / `github.previewUrl`）| `.publish.json` + derived | 列表 col 7 URLs + detail Blogger / GitHub channel |

**動作**：✅ **無需新增**；後續 implementation phase 可 reuse 既有 loader 出之欄位。

### 2.B 可 derived，適合未來 read-only（**5 個**）

| 欄位 | derive 邏輯 | 依賴 |
|---|---|---|
| `canonicalTarget` | per `primaryPlatform` → 對應 `blogger.publishedUrl` 或 `github.previewUrl`（fallback：未 publish 時為 `''`）| 既有 loader 已含 publishedUrl / previewUrl |
| `githubStatus` | derive：`github.enabled && github.previewUrl` → `'rendered'`；`github.enabled && !github.previewUrl` → `'pending'`；`!github.enabled` → `'disabled'` | 既有 loader 已含 enabled / previewUrl |
| `finalUrl` / `platformUrl` | per `primaryPlatform` → 對應 publishedUrl / previewUrl；alias 名（finalUrl 屬 .fb.md 之 outbound link 命名；platformUrl 屬 Admin overview 顯示用）| 同上 |
| `gaHostname` | per `primaryPlatform` → `babel-lab.blogspot.com` / `babel-lab.github.io` / future custom domain；derive 自 `settings.site.bloggerSiteUrl` host + `githubSiteUrl` host | settings 已含 `githubSiteUrl`；`bloggerSiteUrl` 需確認 settings 端 |
| `utmPreviewUrl` | derive：對 `primary URL` 套用 `promotion.config.json` 之 facebook UTM rules + slug；需 import `ga4-url-builder.applyUtm()` + 載入 `promotion.config.json` | 既有 `ga4-url-builder.js` 已含 helper；`promotion.config.json` 已就位 |

**動作**：✅ **適合 future loader 加入**；無 schema 改動；無 source frontmatter 改動。

### 2.C 暫不做（**1 個**）

| 欄位 | 阻擋條件 |
|---|---|
| `platformMigrationNote` | **`.md` frontmatter schema 未引入此欄位**（per `docs/content-platform-routing.md` §1.5 之 future candidate）；若要做，需含：(1) frontmatter schema proposal docs / (2) `validate-content.js` 加 type check / (3) Admin loader expose / (4) Admin EJS 顯示；屬獨立 schema migration phase |

**動作**：⏸ **不在本 implementation plan scope**；屬未來 schema migration phase。

---

## §3 loader implementation plan

### 3.1 B1：cheap derived 欄位（4 個）

**目標**：在 `load-admin-posts.js` 之 `toAdminView()` 加 4 個 derived 欄位，全部基於既有 loader 出之資料；無新 IO；無 helper import 依賴。

| 欄位 | derive 程式碼草案 |
|---|---|
| `canonicalTarget` | ```js<br>const canonicalTarget = primaryPlatform === 'blogger' ? blogger.publishedUrl : (primaryPlatform === 'github' ? github.previewUrl : '');<br>``` |
| `finalUrl` / `platformUrl`（alias）| 同 `canonicalTarget`（兩個欄位顯示同值；前者語意對齊 `.fb.md` outbound link 命名；後者為 Admin overview 顯示語意；可只 expose 一個 `platformUrl` 欄位以避免冗餘）|
| `gaHostname` | ```js<br>function deriveHostname(url) {<br>  if (!url) return '';<br>  try { return new URL(url).hostname; } catch { return ''; }<br>}<br>const gaHostname = deriveHostname(canonicalTarget) \|\| deriveHostname(settings?.site?.githubSiteUrl) \|\| '';<br>``` |
| `githubStatus` | ```js<br>const githubStatus = !github.enabled ? 'disabled' : (github.previewUrl ? 'rendered' : 'pending');<br>``` |

**預估 LOC**：~15-20 行（含註解）；單檔修改 `load-admin-posts.js`。

**不改**：
- ❌ 不改 `.md` frontmatter schema
- ❌ 不改 `.publish.json` schema
- ❌ 不改 `.fb.md` schema
- ❌ 不改 既有 loader return 之 11 個 fb 欄位 / completeness / missingFields

### 3.2 B2：utmPreviewUrl derived

**目標**：在 loader 加 `utmPreviewUrl` 欄位；需 import + 載入 settings。

| 動作 | 詳情 |
|---|---|
| Import | `import { applyUtm, expandPattern } from './ga4-url-builder.js';` |
| 載入 promotion.config | 可由 `loadAdminPosts({ settings })` 之 settings 已含 promotion.config（**需確認 loadSettings 邏輯**）；若未含，需新 `await fs.readFile('content/settings/promotion.config.json')` |
| derive 邏輯 | ```js<br>const fbUtm = settings?.promotion?.facebook?.utm;<br>let utmPreviewUrl = '';<br>if (fbUtm && canonicalTarget && slug) {<br>  const page = (fb.exists && fb.enabled) ? (fbData?.page \|\| fbUtm.defaultPage) : (fbUtm.defaultPage \|\| 'fan1');<br>  const utmParams = {<br>    source: fbUtm.source,<br>    medium: fbUtm.medium,<br>    campaign: expandPattern(fbUtm.campaignPattern, { page, slug }),<br>    content: expandPattern(fbUtm.contentPattern, { page, slug }),<br>  };<br>  utmPreviewUrl = applyUtm(canonicalTarget, utmParams) \|\| '';<br>}<br>``` |

**預估 LOC**：~25-35 行（含 import + derive + null guard）；單檔修改 `load-admin-posts.js`。

**不改**：
- ❌ 不改 `ga4-url-builder.js`（只 import；不動）
- ❌ 不改 `promotion.config.json`（只讀；不動）
- ❌ 不改 既有 fb 欄位 derive

### 3.3 不改項

| 項目 | 理由 |
|---|---|
| `.md` frontmatter schema | 純 derived；不需新 metadata |
| `.publish.json` schema | 同上 |
| `.fb.md` schema | 同上 |
| `validate-content.js` rules | 純 read-only Admin；不影響 validate baseline 39/34 |
| `build-github.js` / `build-blogger.js` / `build-promotion.js` | 不接 Admin loader；無 cross-contamination |

---

## §4 UI implementation plan

### 4.1 detail panel — 新增 Platform Routing section

**放置位置**：**Identity section 之後、Blogger channel section 之前**（即 `index.ejs` line 282 之後、line 307 之前）。

#### Section 結構草案

```ejs
<div class="detail-section">
  <h3>Platform Routing</h3>
  <dl class="detail-grid">
    <dt>primaryPlatform</dt>
    <dd>
      <% if (p.primaryPlatform === 'blogger') { %><span class="badge b-info">📘 blogger</span>
      <% } else if (p.primaryPlatform === 'github') { %><span class="badge b-ok">🐙 github</span>
      <% } else { %><span class="badge b-missing">(empty)</span><% } %>
    </dd>

    <dt>publishTargets</dt>
    <dd>
      <% if (p.blogger.enabled) { %><span class="badge b-ok">📘 blogger / <%= p.blogger.mode %></span><% } %>
      <% if (p.github.enabled) { %><span class="badge b-ok">🐙 github / <%= p.github.mode %></span><% } %>
      <% if (!p.blogger.enabled && !p.github.enabled) { %><span class="badge b-missing">(none)</span><% } %>
    </dd>

    <dt>canonicalTarget</dt>
    <dd class="mono">
      <% if (p.canonicalTarget) { %><a href="<%= p.canonicalTarget %>" target="_blank" rel="noopener noreferrer"><%= p.canonicalTarget %></a><% } else { %>(empty)<% } %>
    </dd>

    <dt>platformUrl</dt>
    <dd class="mono">
      <% if (p.platformUrl) { %><a href="<%= p.platformUrl %>" target="_blank" rel="noopener noreferrer"><%= p.platformUrl %></a><% } else { %>(empty)<% } %>
    </dd>

    <dt>gaHostname</dt>
    <dd class="mono" style="font-size: 0.85em;"><%= p.gaHostname || '(empty)' %></dd>

    <dt>bloggerStatus</dt>
    <dd><span class="badge <%= p.blogger.status === 'published' ? 'b-published' : 'b-info' %>"><%= p.blogger.status || '(empty)' %></span></dd>

    <dt>githubStatus</dt>
    <dd>
      <% if (p.githubStatus === 'rendered') { %><span class="badge b-ok">rendered</span>
      <% } else if (p.githubStatus === 'pending') { %><span class="badge b-draft">pending</span>
      <% } else { %><span class="badge b-info">disabled</span><% } %>
    </dd>
  </dl>

  <details style="margin-top: 0.5rem;">
    <summary style="cursor: pointer; color: #2c5282; font-size: 0.9em;">Show utmPreviewUrl</summary>
    <p class="mono" style="margin-top: 0.25rem; word-break: break-all; font-size: 0.85em;">
      <% if (p.utmPreviewUrl) { %><a href="<%= p.utmPreviewUrl %>" target="_blank" rel="noopener noreferrer"><%= p.utmPreviewUrl %></a><% } else { %>(no UTM preview;確認 FB enabled + canonical URL)<% } %>
    </p>
  </details>
</div>
```

### 4.2 列表 row（**選做**）

| 動作 | 內容 |
|---|---|
| 列表不新增新欄 | ✅（per spec）|
| **可選**：在 `kind / status` 欄之 status badge 旁加小型 platform badge | `📘` for blogger primary / `🐙` for github primary；hover 顯示 `primaryPlatform` 全名；最小 footprint |

→ 屬 B4 子 phase（可選；視 user 偏好）。

### 4.3 stats cards 不擴充

per spec；維持 12 張之既有設計。

### 4.4 避免畫面太雜措施

| 措施 | 動作 |
|---|---|
| utmPreviewUrl 用 `<details>` 收合 | 預設收合；user click 才展開；避免 detail panel 加長 |
| gaHostname 用 mono small text（0.85em）| 視覺輕量 |
| Platform Routing section 之 badge 顏色與既有 b-info / b-ok / b-missing class 一致 | 不引入新 CSS class；reuse 既有 |
| 列表 platform indicator badge（可選）| icon-only；無文字；最小 footprint |

---

## §5 拆批建議（pm-56 ~ pm-59）

| Phase | 範圍 | LOC | 性質 | 風險 |
|---|---|---|---|---|
| **pm-56** loader cheap derived | `load-admin-posts.js` 加 4 個 derived 欄位（canonicalTarget / platformUrl / gaHostname / githubStatus）| ~15-20 行 | source | 🟢 低 |
| **pm-57** EJS Platform Routing section | `src/views/admin/index.ejs` 新增 section（after Identity）；不含 utmPreviewUrl | ~50-70 行 EJS | source | 🟢 低 |
| **pm-58** utmPreviewUrl derived + UI preview | loader 加 utmPreviewUrl + EJS 之 `<details>` 收合 UI | loader ~25 行 + EJS ~15 行 | source | 🟢 低-中 |
| **pm-59**（可選）列表 platform indicator badge | `index.ejs` 列表 col 2 加 platform icon badge | ~10 行 EJS | source | 🟢 低 |
| **future**：platformMigrationNote schema | 獨立 phase；含 schema proposal docs + validate-content rule + frontmatter accept + Admin display | 較大；中型 phase | source + content | 🟡 中（schema 擴充）|

### 5.1 推薦執行順序

| 順序 | phase | 理由 |
|---|---|---|
| 1 | **pm-56** loader cheap derived | 最小；無 import 依賴；無 fixture 影響 |
| 2 | **pm-57** EJS Platform Routing section | loader 就位後 EJS 才能 render；屬自然下游 |
| 3 | **pm-58** utmPreviewUrl | 需 helper import；屬 enhancement；可獨立 |
| 4 | **pm-59** 列表 badge | 可選；UI polish；屬最終 |
| 5 | future schema phase | 等 user 表態 platformMigrationNote 需求 |

### 5.2 user 可選暫停點

| 暫停點 | 影響 |
|---|---|
| pm-56 後暫停 | loader 含 derived；但 UI 未顯示；Admin overview 視覺不變；可後續 EJS 補上 |
| pm-57 後暫停 | Platform Routing section 已可見；但 utmPreviewUrl 未含；功能 80% 完成 |
| pm-58 後 | 功能完整；列表保持簡潔 |
| pm-59 後 | 全套完成 |

---

## §6 風險與限制

| 項目 | 狀態 |
|---|---|
| **read-only only** | ✅ 全程不引入 write path；無 form / submit / fetch / fs write / Apply button |
| 不做 write | ✅ |
| 不做 schema migration | ✅（platformMigrationNote 屬獨立 future phase）|
| 不改 .md / .publish.json / .fb.md frontmatter | ✅（純 derived）|
| 不影響 GitHub Pages production | ✅（Admin 為 dev-mode-only；prod build 不產出 admin 頁；driven by `mode === 'dev'` gating in `build-github.js`）|
| 不 deploy | ✅ |
| 不影響 validate baseline 39/34 | ✅（純 Admin loader / EJS；validate-content 不接 Admin）|
| Admin dev-mode-only | ✅ 維持既有設計 |
| 不影響 FB pipeline / Blogger pipeline | ✅（兩 pipelines 獨立；Admin loader 不被 build-blogger / build-promotion 使用）|
| 不影響 GA4 / UTM 既有 production output | ✅（utmPreviewUrl 為 Admin read-only preview；不寫入任何檔；不影響 cross-link UTM 之 ga4-url-builder.js 既有實作）|

---

## §7 驗收方式

| 階段 | 驗收 |
|---|---|
| **pm-55（本批 docs-only）** | `git diff` 確認 docs-only；無 source / content / settings / dist / deploy 改動；working tree clean |
| **pm-56 loader phase** | `git diff -- src/scripts/load-admin-posts.js` 確認單檔；無 build 必要（loader 改動於 `predev` 階段自動執行）；可選 `npm run dev` 訪問 `/admin/` detail panel hover 確認 derived 欄位顯示（雖 EJS 未顯示，但 admin loader 不會 crash）|
| **pm-57 EJS phase** | `git diff -- src/views/admin/index.ejs` 確認 section 新增範圍；`npm run dev` 訪問 `/admin/` → click row → 確認 Platform Routing section 出現於 Identity 之後 |
| **pm-58 utmPreviewUrl phase** | loader + EJS diff；`/admin/` 訪問確認 `<details>` 展開後顯示 UTM preview URL |
| **pm-59（可選）列表 badge** | EJS diff；`/admin/` 列表 col 2 確認 platform icon 顯示 |
| **不需** | ❌ `npm run build` / ❌ `npm run validate:content` / ❌ `npm run build:*` / ❌ deploy |
| **將來若需 user 自測** | 啟動 `npm run dev` + 訪問 `http://localhost:5173/admin/` |

---

## §8 邊界聲明

- ✅ 本文件**僅為 docs-only implementation plan**；不改 source / Admin UI / loader / content / build / dist / deploy
- ✅ 本文件**不啟動 Admin write**（per `docs/admin-2-write-pre-analysis.md`）
- ✅ 本文件**不啟動 schema migration**（platformMigrationNote 屬未來）
- ✅ 本文件**不影響** GitHub Pages production / GA4 / UTM / Blogger / FB / validate baseline
- ✅ 不 push gh-pages；不 deploy
- ✅ 後續 pm-56 ~ pm-59 啟動須 user 明示

---

## §9 Cross-links

- `docs/content-platform-routing.md` §3（pm-49；12 個候選欄位列表）
- `docs/admin-1-completion-report.md` §13（既有 Admin overview 完成紀錄）
- `docs/admin-mvp-pre-analysis.md`（Admin 原始設計）
- `docs/admin-2-write-pre-analysis.md`（Admin write 未來 phase；本文件 read-only 不啟動）
- `docs/ga4-parameter-naming-registry.md` §4.1 / §9（FB UTM convention；utmPreviewUrl 派生依據）
- `src/views/admin/index.ejs`（既有 Admin UI；future 修改點）
- `src/scripts/load-admin-posts.js`（既有 loader；future 修改點）
- `src/scripts/ga4-url-builder.js`（pm-58 待 import 之 helper）
- `content/settings/promotion.config.json`（pm-58 待讀之 settings）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`；不影響本計畫；參考）

---

（本文件結束）
