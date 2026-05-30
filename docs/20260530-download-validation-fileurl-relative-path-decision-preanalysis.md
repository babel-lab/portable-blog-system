# 20260530 Download Validation fileUrl Relative Path Decision Preanalysis

> Phase: `20260530-am-11-download-validation-fileurl-relative-path-decision-docs-only-a`
> Date: 2026-05-30 10:05 +0800
> Scope: **docs-only**（無 source / content / settings / templates / package / fixture / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本 phase 是 **docs-only decision preanalysis**：
  - ❌ 不實作 D3 validator（`src/scripts/validate-content.js` 一行不動）
  - ❌ 不新增 fixture（`content/validation-fixtures/` 不動）
  - ❌ 不改 content / settings / templates / package / dist / gh-pages
  - ❌ 不 build / deploy / Blogger repost / GA4 validate / reverse UTM activate / pm-26 unblock
  - ❌ 不建立 settings registry；不建立 download landing page source
  - ❌ 不改既有 am-7 D1 / D2 implementation
  - ❌ 不改既有 am-9 D3 / S1 / S2 decision doc
- 目標：在進入 D3 source implementation 前，**只**裁決一題 ——
  **`download.fileUrl` 是否允許 relative path / repo-internal path？**
  並把該裁決固化為 docs entry，供 am-12 D3 source phase 之 regex 邊界直接讀。
- 本文件**不**改前序 docs（am-1 rules / am-3 fixture-design / am-5 source-implementation / am-9 D3-S1-S2 decision）之 D1 / D2 / D3 / D4 / S1 / S2 / F-A 之命名、語意、severity；僅針對 am-9 §5.4 outstanding decision「是否允許 relative path」單題做 docs-only 裁決。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔。

---

## 2. Baseline Snapshot

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `db942cc7976af03e2253a1f331a7c185ed75933c` |
| origin/main | `db942cc7976af03e2253a1f331a7c185ed75933c` |
| short hash | `db942cc` |
| latest subject | `docs(download): decide D3 S1 S2 validation scope` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`，無 untracked） |
| `validate:content` | **0 error(s) / 44 warning(s) on 39 post(s)** |

### 2.1 既有 phase 落地堆疊

| Phase | 性質 | 規則 / fixture | baseline 變動 |
|-------|------|---------------|-------------|
| am-5 | D1 / D2 implementation preanalysis（docs-only） | n/a | 37 / 42 不變 |
| am-6 | am-5 acceptance（read-only） | n/a | 37 / 42 不變 |
| am-7 | D1 + D2 source + 2 fixtures | `_test-download-enabled-fileurl-empty.md` + `_test-download-fileurl-invalid-type.md` | 37 → 39 / 42 → 44 |
| am-8 | am-7 acceptance（read-only） | n/a | 39 / 44 不變 |
| am-9 | D3 / S1 / S2 decision preanalysis（docs-only） | n/a | 39 / 44 不變 |
| am-10 |（未啟動：am-9 acceptance read-only） | — | — |
| **am-11（本 phase）** | **D3 relative path 允許性 decision（docs-only）** | n/a | **39 / 44 不變（預期）** |

### 2.2 am-7 D1 / D2 已完成事實

- D1 `download-enabled-fileurl-empty`：✅ 已實作；ready/published only；條件 = `contentKind === 'download'` 且 `download.enabled === true` 且 `fileUrl` 為 `undefined` / empty string / whitespace-only string。
- D2 `download-fileurl-invalid-type`：✅ 已實作；所有 status；條件 = `download.fileUrl !== undefined` 且非 string。
- D1 / D2 **互斥**：fileUrl 非 string 由 D2 接住，不再被 D1 視為 empty string。

### 2.3 am-9 D3 / S1 / S2 decision 落地事實

- D3 `download-fileurl-invalid-format`：🟡 deferred；am-9 §5.8 建議採 **B-strict（`^https?://`）** 為 default，**但**relative path 允許性留待**另開** docs-only phase 裁決（即本 phase）。
- preview-url-risk：❌ 不實作 validator；改為 future docs-only policy。
- S1 / S2：🟢 建議合併（option β）；defer 至 am-15。

---

## 3. Evidence Reviewed

read-only 讀取（per 指示文允許範圍）：

| 檔案 | 狀態 | 用途 |
|------|------|------|
| `docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md`（am-9） | ✅ 已讀 | §5.4「outstanding：relative path 未裁決」之原始記錄；§14.1「采 B-strict 為 default」之 conditional 建議 |
| `docs/20260530-download-validation-warning-source-implementation-preanalysis.md`（am-5） | ✅ 已讀 | §7.1 D3 pseudo；§11.3 過嚴 vs 過寬 risk |
| `docs/20260530-download-validation-warning-fixture-design-preanalysis.md`（am-3） | ✅ 已讀 | §6.3 D3 message copy 草案；§8.5 不填真實 URL（fixture 紅線） |
| `docs/20260530-download-validation-rules-preanalysis.md`（am-1） | ✅ 已讀 | §3 D3 草案 + 「相對路徑允許性留待規則實作 phase 同時定稿」 |
| `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16） | ✅ 部份讀（前 120 行） | §4 確認下載流程；asset = Drive；landing page 為 noindex 中繼頁 |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | ✅ 已讀 | 唯一 download 文章（draft）；`download.fileUrl: ""`；status=draft → 不進 ready/published validation |
| `content/templates/blogger-download-template.md` | ✅ 已讀 | `download.fileUrl: ""` 為 placeholder；無 relative-path 案例 |
| `src/scripts/validate-content.js` L450–L495 | ✅ 已讀 | 確認 D1 / D2 既落地 pattern；L464 註釋明示「不檢查 URL format / preview URL risk」屬 am-9+ 範圍 |
| `src/scripts/build-blogger.js` | ✅ grep 確認 fileUrl 未在 build-blogger.js 內被改寫 | render 端僅 raw passthrough |
| `src/scripts/build-github.js` L275–L308 | ✅ 已讀 | robots meta precedence；確認 SEO-1 fallback 對 contentKind=download 自動套 `noindex, follow` |
| `src/scripts/build-sitemap.js` L115–L135 | ✅ 已讀 | sitemap inclusion precedence；確認 SEO-1 fallback 對 contentKind=download 自動排除 |
| **`src/views/pages/post-detail.ejs` L106–L117** | ✅ 已讀（grep） | **GitHub Pages render：`<a href="<%= post.download.fileUrl %>" download>` raw passthrough；不加 target；不加 rel；無 URL normalize / prefix 處理** |
| **`src/views/blogger/blogger-post-full.ejs` L80–L92** | ✅ 已讀（grep） | **Blogger render：`<a href="<%= post.download.fileUrl %>" download>` raw passthrough；不加 target；不加 rel；無 URL normalize / prefix 處理** |
| `public/downloads/` | ✅ 已 `ls` | **目錄存在但為空**；Phase 0 鷹架建立，無實際下載資產；無「以 relative path 指向 public/downloads/...」之 production case |
| `package.json` | ✅ 已讀 | `validate:content` script；無相關依賴 |

### 3.1 missing-but-non-blocking

- `docs/20260530-download-validation-warning-source-implementation-preanalysis.md` 已存在，**非** missing。
- `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md` 未在本 phase 直讀（其 R1 / R2 / R3 紅線已透過 pm-20 / am-9 間接固化）；非 blocking。

---

## 4. Current D3 Decision Context

### 4.1 D1 / D2 / D3 之邊界（per am-9 §5.2 沿用）

| 情境 | 由哪條規則接住 |
|------|--------------|
| `download.fileUrl === undefined` 且 D1 觸發條件全滿足（contentKind=download / enabled=true / ready or published） | ✅ D1 |
| `download.fileUrl === ""` / whitespace-only string + D1 觸發條件全滿足 | ✅ D1 |
| `download.fileUrl !== undefined` 且非 string | ✅ D2 |
| `download.fileUrl` 為 non-empty trimmed string 但格式不符 | ❌ **D3 候選範圍** |

### 4.2 am-9 已固化之 D3 設計

- D3 唯一新增涵蓋面 = non-empty trimmed string + 格式不合 URL。
- D3 觸發範圍：ready / published only（per am-9 §5.5）。
- preview-url-risk 不進 D3；屬未來 docs-only policy（per am-9 §6.5）。
- relative path 允許性 outstanding → 本 phase 裁決。

### 4.3 本 phase 必須裁決之單一問題

> **`download.fileUrl` 是否允許 relative path / repo-internal path？若允許，採何種前綴規則？若不允許，D3 之 regex 是否採 strict `^https?://`？**

D3 之 source implementation **尚未開始**；本 phase 之裁決即為 am-12（D3 source phase）regex 邊界之輸入。

---

## 5. Candidate URL Policy Options

下表為 4 個候選 URL policy；各列「✅」「🟡」「❌」為相對評估，非絕對好壞。

### 5.1 Option A — Strict external URL only（`^https?://`）

| 維度 | 評估 |
|------|------|
| 描述 | D3 regex 採 `^https?://`；relative path / repo-internal path / mailto / tel / data / javascript / ftp 一律觸發 warning |
| implementation simplicity | ✅ 高：單一 regex；零 platform branching |
| false positive risk | 🟡 中：若未來作者意圖採用 `/downloads/foo.pdf` 之相對路徑 → 觸發 warning（warning-only，不阻斷 build） |
| false negative risk | ✅ 低：所有非 http(s) URL 一律標出；preview-url-risk 仍屬獨立面向（per am-9 §6） |
| build / deploy portability | ✅ 高：fileUrl 為 absolute URL，render 至 Blogger 與 GitHub Pages 兩端 anchor 行為一致；不依賴 base path / custom domain |
| Blogger compatibility | ✅ 高：Blogger 之 HTML 內 `<a href="https://...">` 為標準用法；無 base 漂移 |
| GitHub Pages compatibility | ✅ 高：同上 |
| Admin future compatibility | ✅ 高：未來 Admin / DownloadAsset registry 落地後，可改由 registry 決定 internal vs external，D3 之 regex 保持為 external boundary check，無需重寫 |
| fixture design complexity | ✅ 低：1 個 negative（`fileUrl: "not-a-url"`）即可 |
| recommended? | 🟢 **strongly recommended** |

### 5.2 Option B — External URL + root-relative path（`^https?://` OR `^/[^/]`）

| 維度 | 評估 |
|------|------|
| 描述 | 允許 `http(s)://` 與 `/downloads/foo.pdf` 類 root-relative path；不允許 `./relative` / `../foo` |
| implementation simplicity | 🟡 中：regex 需 OR；需文檔說明 root-relative 之意義 |
| false positive risk | ✅ 較低：常見 root-relative case 不被誤警告 |
| false negative risk | 🔴 高：root-relative path 在 **Blogger render（HTML embedded in blogger.com）** 解析至 `https://<blogger-host>/downloads/foo.pdf`，**該 host 上不存在 public/downloads/**；同一 fileUrl render 兩端會指向兩個**不同 host 之同 path**，其中一個必然失效 |
| build / deploy portability | 🔴 高 risk：root-relative path 在 Blogger 與 GitHub Pages 環境之解析 base 不同；同一 frontmatter 值無法跨平台一致 |
| Blogger compatibility | 🔴 不一致：Blogger 端會嘗試解析至 `babel-lab.blogspot.com/downloads/foo.pdf`（不存在） |
| GitHub Pages compatibility | 🟡 半：若 `public/downloads/` 有檔案，root-relative 可運作；但會與 Vite `base` 設定耦合（custom domain 後 base 可能改變） |
| Admin future compatibility | 🟡 中：未來 registry 若以 asset id 解 internal，會與此 policy 重複；屬遷移負擔 |
| fixture design complexity | 🟡 中：需多 1 個 positive case 涵蓋 `^/[^/]`；且 fixture 仍需明示為 fixture（避免假設 public/downloads/ 內檔案存在） |
| recommended? | ❌ **not recommended** —— Blogger / GitHub Pages cross-render 不一致為硬傷 |

### 5.3 Option C — External URL + repo-relative path（`^https?://` OR `^assets/` / `^downloads/`）

| 維度 | 評估 |
|------|------|
| 描述 | 允許 `http(s)://` 與 repo-relative path（如 `assets/downloads/file.pdf`） |
| implementation simplicity | 🔴 低：repo-relative path 在 render HTML 內無瀏覽器原生定義（瀏覽器以當前 document URL 為 base，非「repo root」）；需 build 端額外 rewrite |
| false positive risk | 🟡 中 |
| false negative risk | 🔴 極高：browser 不會把 `assets/downloads/file.pdf` 解析至 `public/downloads/` 路徑；render 後 link 對 reader 永遠 404 |
| build / deploy portability | 🔴 低：需引入 fileUrl 之 build-time rewrite（mirror image source path rewrite），但 download box render 目前為 raw passthrough（per §3 evidence post-detail.ejs L115 / blogger-post-full.ejs L89） |
| Blogger compatibility | 🔴 不可用：Blogger 端無 repo 概念 |
| GitHub Pages compatibility | 🔴 不可用（除非 build 改造） |
| Admin future compatibility | 🔴 低：與未來 DownloadAsset registry 之 id-based reference 嚴重重複 |
| fixture design complexity | 🔴 高 |
| recommended? | ❌ **strongly not recommended** —— browser 解析語意天生不支援；無 sane render 路徑 |

### 5.4 Option D — Defer all relative path support until DownloadAsset registry

| 維度 | 評估 |
|------|------|
| 描述 | D3 採 `^https?://`（同 Option A）；任何 internal asset 留待 DownloadAsset registry 落地後以 `assetRefs[]` 或 `assetId` 等 named reference 表達，**不**讓 `download.fileUrl` 之 raw string 自由填寫 internal path |
| implementation simplicity | ✅ 高：D3 同 Option A；registry 屬獨立 pipeline，與 D3 解耦 |
| false positive risk | 🟡 同 Option A |
| false negative risk | ✅ 低 |
| build / deploy portability | ✅ 高：所有 deploy concerns 集中於 registry（asset id → URL 之 resolution 在 build-time 統一處理） |
| Blogger compatibility | ✅ 高（registry 落地後 build 端可分別產 Blogger 用 URL 與 GitHub 用 URL） |
| GitHub Pages compatibility | ✅ 高 |
| Admin future compatibility | ✅ 最高：與 pm-16 / pm-20 之 DownloadAsset / FormConfig registry 設計完全對齊 |
| fixture design complexity | ✅ 低（D3 部分同 Option A）；registry-side fixture 屬 A1 / A2 / A3 之 future scope |
| recommended? | 🟢 **strongly recommended（作為長期方向）** |

### 5.5 Option A vs Option D 之關係

- **短期（am-12 D3 source phase）**：Option A 與 Option D **對 D3 regex 之裁決完全相同** —— 皆採 `^https?://`。
- **長期（registry 落地後）**：
  - Option A 不對「未來 relative path 允許性」做承諾；若需要 internal asset，可重新 docs-裁決升級至 Option B / C。
  - Option D 明確承諾「未來 internal asset 應由 DownloadAsset registry 之 named reference 表達」，而非 `download.fileUrl` raw string；D3 之 regex 即使長期亦保持 `^https?://`。
- **本 phase 推薦 Option D**：因其同時固定 D3 regex 與長期 internal asset 路徑，避免未來反覆。

---

## 6. Recommended Policy

### 6.1 主建議：採 Option D

- D3 之 regex 邊界：**B-strict（`^https?://`）**。
- relative path / repo-internal path **不允許**填入 `download.fileUrl` raw string。
- 未來 internal asset 需求 → **由 DownloadAsset registry 之 named reference（`assetRefs[]` / `assetId` 等，命名待定）承載**，**不**由 fileUrl raw string 自由填寫。
- preview-url-risk（per am-9 §6.5）仍維持 docs-only policy 候選；不在 D3 regex 內處理。

### 6.2 推薦理由（按 evidence 強度排序）

1. **Blogger 與 GitHub Pages 之 render base 不同（§3 evidence post-detail.ejs / blogger-post-full.ejs）**：兩端皆為 raw passthrough；relative path 之 base 漂移為硬傷。Option A / D 直接消除此漂移。
2. **`public/downloads/` 目錄為空（§3 evidence）**：repo 目前**無**任何 production case 採用相對路徑；不存在「為現有 production case 鬆綁」之需求。
3. **am-1 §3 D3 即明示「相對路徑允許性留待規則實作 phase 同時定稿」**：本 phase 即為該裁決；採保守 Option D 與設計初衷一致。
4. **pm-16 §4 / §5 之 DownloadAsset registry concept 已存在 docs trail**：Option D 與已有 docs trail 對齊；採 Option B / C 會與 registry 設計重複。
5. **am-7 D1 / D2 已落地之保守 cadence**：本系列規則皆採保守先行；Option D 與 cadence 一致。
6. **am-9 §5.8 conditional recommendation 即為 B-strict default + 留待 relative path 裁決**：本 phase 將 conditional 升級為 unconditional 裁決。
7. **R2 紅線（per pm-20 §4）**：`download.fileUrl` 不與 Google Form URL 混為一談；Option D 對 fileUrl 之 raw string 範圍最嚴格，與 R2 紅線最一致。

### 6.3 為何不採 Option A 之鬆綁版本

- 若 Option A 只當「短期 D3 regex 來源」、不對長期 internal asset 路徑承諾，未來若有 internal asset 需求時，可能會傾向「直接允許 root-relative」之 quick fix，重新踩 Option B 之 Blogger / GitHub render base 漂移坑。
- Option D 提前固化「internal asset 走 registry」，可避免上述 quick fix；屬 architectural commitment，非僅 implementation choice。

---

## 7. Internal Path / Blogger / GitHub Route Analysis

### 7.1 Blogger 文章內連結與 `download.fileUrl` 是否同一概念

- **Blogger 文章內一般連結**：作者於 frontmatter 之 `relatedLinks` / `otherLinks` 內手填；render 端對「Blogger 內部連結」並無特殊 routing；皆視為 URL 字串嵌入 `<a href>`。
- **`download.fileUrl`**：作者於 frontmatter `download.fileUrl` 填寫；render 端為 raw passthrough `<a href="..." download>`，不加 target / rel。
- **結論**：兩者 render 端機制相同，但**目的不同** —— `relatedLinks` 為 article-internal cross-reference（已有 §16.5 之 internal / external 雙模式設計）；`fileUrl` 為**單檔下載資產**，期望使用者直接觸發下載。
- **是否同一概念**：❌ 否；不可混用 `relatedLinks` 之 internal path 設計到 `fileUrl`。relatedLinks 之 internal 走 published URL（per §16.5），fileUrl 走 download asset URL（Drive direct / Drive share / 外部 CDN）。

### 7.2 GitHub Pages internal path 是否穩定

- **目前狀態**：Vite 之 `base` 設定預設與 GitHub Pages project page（`/<repo>/`）一致；render 端對 `<a href>` **不**主動 rewrite。
- **custom domain 後**：base 可能改變；root-relative path 之解析會跟著飄。
- **public/downloads/ 內容**：empty（§3 evidence）；無檔可指。
- **結論**：GitHub Pages 之 internal path **語意可運作**（root-relative 會解析至同 host），但**穩定性受 Vite base / custom domain 設定耦合**；不適合作為作者填 fileUrl 之 sane 預設。

### 7.3 local dev path / deployed path 是否一致

- **`npm run dev`**：Vite 之 base 為 `/`；root-relative `/downloads/foo.pdf` 會解析至 `localhost:5173/downloads/foo.pdf`（若 `public/downloads/` 有對應檔則可運作）。
- **`npm run build` + GitHub Pages 部署**：base 為 repo path；root-relative 會解析至 `babel-lab.github.io/<repo>/downloads/foo.pdf`。
- **結論**：local dev 與 deploy 後**不一致**；同一 frontmatter 值之解析結果不同。若採 Option B 會落地此不一致。

### 7.4 custom domain 後是否改變語意

- **若未來綁定 custom domain**（per CLAUDE.md §2.2 「未來可綁自訂網域」）：Vite base 配置可能改為 `/`；root-relative 之 base 跟著改。
- **影響**：採 Option B 時，custom domain 切換會破壞既有 fileUrl 之解析；屬潛在 migration cost。
- **Option A / D 無此風險**：absolute URL 不受 base 影響。

### 7.5 root-relative path 在 Blogger 與 GitHub 是否同樣可用

- **Blogger 端**：Blogger 之 HTML 嵌入於 `babel-lab.blogspot.com`（或自訂 Blogger 域名）；root-relative `/downloads/foo.pdf` 會解析至 `babel-lab.blogspot.com/downloads/foo.pdf` —— **該 host 無 public/downloads/，永遠 404**。
- **GitHub Pages 端**：root-relative 會解析至 GitHub Pages base（可能含 repo path）；若 `public/downloads/` 有檔，**僅 GitHub 端**可運作。
- **結論**：同一 fileUrl render 到兩端，**Blogger 端必然失效**；屬不可調和之 cross-platform 行為差異。

### 7.6 repo-relative path 是否可能在 deploy 後失效

- 是。瀏覽器不存在「repo root」概念；repo-relative path 在 render HTML 內**無 sane 解析語意**。
- 即使 build 端 rewrite，render context 對 Blogger 端仍無法給出 sane URL（Blogger 不可能託管 GitHub Pages 之資產）。
- **結論**：repo-relative path（Option C）天生不可用於 cross-platform render。

---

## 8. Google Drive / External Asset Boundary

### 8.1 Google Drive public share URL 是否仍屬 external URL

- `https://drive.google.com/file/d/<id>/view?usp=sharing`
- **格式層面**：✅ 仍屬 external URL（命中 `^https?://`）。
- **D3 之裁決**：✅ 通過 D3 regex 檢查。
- **語意層面之 preview-url-risk**：屬 am-9 §6 之獨立面向；不在本 phase / D3 範圍。

### 8.2 Google Drive direct download URL 是否仍屬 external URL

- `https://drive.google.com/uc?export=download&id=<id>`
- **格式層面**：✅ 仍屬 external URL；命中 `^https?://`。
- **D3**：✅ 通過。
- **語意層面**：✅ 較理想；validator **不主動「強迫」採此形式**（無 share-url-prefer-direct rule）。

### 8.3 Drive URL 是否只做 syntax check

- **是**。D3 只做 `^https?://` regex；**不**做 reachability / **不**做 permission（public vs restricted）check / **不**做 file existence check。
- **D4 non-rule 宣告**（per am-1 §3）：validator 永不做網路檢查；reachability 屬獨立 `check-broken-links.js` 或 manual gate 範疇。

### 8.4 preview-url-risk 是否仍維持 docs-only / future registry lookup

- **是**。per am-9 §6.5：
  - **不**實作 validator。
  - 改為 docs-only policy（記錄於 CLAUDE.md §13 或新 docs，命名待定）。
  - 候選實作時機：DownloadAsset registry 落地後，改以 registry lookup 判斷 `delivery mode` 欄位，**不**走 URL regex。
- **本 phase 不變動此裁決**。

### 8.5 之後若有 DownloadAsset registry，是否應把 Drive semantic policy 移到 registry

- ✅ **是**。理由：
  - Drive URL pattern 易變（`/view?usp=sharing` / `/view?usp=share_link` / `/preview` 等變體）；validator regex 維護成本高。
  - registry 之 `delivery mode`（如 `drive-direct` / `drive-share` / `external-cdn` / `internal`）可明示語意，validator 不需 reverse-engineer URL pattern。
  - registry 之 `storage` 欄位可承擔 reachability 之 manual gate（如「已測試 public access」flag）。
- **建議 future arch**：
  - registry entry 內 explicit 記錄 `assetUrl` + `deliveryMode`。
  - validator 對 registry-linked download → 改檢查 registry consistency，不檢查 raw URL semantic。
  - 對非 registry-linked download（即 `fileUrl` raw string）→ 仍套 D3 regex（B-strict）。

### 8.6 R2 紅線（per pm-20 §4）— 不混 Google Form URL

- **fileUrl ≠ Google Form URL** 之紅線在 D3 regex 層**不**做機械檢查（Google Form URL 為 `https://docs.google.com/forms/d/e/...`，命中 `^https?://`）。
- R2 紅線屬語意層裁決（per pm-10 / pm-11 / pm-16）；違規屬作者誤填，**不**期望 D3 regex 接住。
- **若未來要在 validator 內檢測**：屬 future rule 候選（如 `download-fileurl-form-url-misuse`），應於 docs-only policy + registry 落地後另行裁決；**不**併入 D3。

---

## 9. Proposed Future D3 Rule Shape

> 僅規劃；本 phase 不實作。am-12 source phase 之 implementation 須 mirror 此 shape。

### 9.1 規則 shape table

| 項目 | 內容 |
|------|------|
| warning id | `download-fileurl-invalid-format` |
| severity | warning |
| status gate | ready / published only（mirror D1 ready/published 範圍；mirror am-9 §5.5）|
| trigger condition | `post.download` 為 plain object 且 `post.download.fileUrl` 為 non-empty trimmed string 且不符 regex `/^https?:\/\//` |
| allowed URL pattern | `^https?://`（B-strict per am-9 §5.3）|
| denied patterns | root-relative（`/downloads/...`）、repo-relative（`assets/downloads/...`）、scheme-only relative（`./` / `../`）、`mailto:` / `tel:` / `javascript:` / `data:` / `ftp:` / 純文字 |
| warning value 草案 | `download.fileUrl="${url}" is not a valid http(s) URL` |
| D1 / D2 / D3 互斥順序 | D2（非 string）→ D1（enabled + empty）→ D3（non-empty string + invalid format）；三者於同一 post 對 fileUrl 只 push 1 條（D1 / D2 互斥已落地；D3 之 trigger 要求 non-empty string → 與 D1 / D2 之 trigger 天然互斥）|
| fixture requirement | 1 個 negative：`_test-download-fileurl-invalid-format.md`（per am-9 §10.1 fixture 草案；本 phase 不新增）|
| expected baseline impact | **44 → 45 / 39 → 40**（am-12 落地後）|
| source position（pseudo） | `validate-content.js` 內既有 D1 / D2 block 之尾段；於 D2 check 之後、D1 check 之 `else if` 鏈中 push 新 branch 或於 outer block 新增第三條 if |
| registry lookup | **無**（D3 為純 frontmatter regex 檢查；不依賴 registry）|

### 9.2 與 preview-url-risk 之關係

- D3 **不**承擔 preview-url-risk；後者為 future docs-only policy（per am-9 §6.5）。
- D3 對 Drive preview URL（`/file/d/<id>/preview`）一律 **pass**（命中 `^https?://`）；preview-url-risk 屬語意層，由 docs / 未來 registry 處理。

### 9.3 與 S1 / S2 之關係

- D3 與 S1 / S2 完全獨立。
- D3 觸發條件不需 `seo` block；S1 / S2 觸發條件不需 `download.fileUrl`。
- 兩系列 fixture 可獨立。

---

## 10. Fixture Strategy for Future D3

> **本 phase 不新增任何 fixture**。本節為**未來** am-12 fixture-add 之預先記錄。

### 10.1 fixture 路徑與檔名

- 建議 path：`content/validation-fixtures/blogger/posts/`
- 建議 filename：`_test-download-fileurl-invalid-format.md`

### 10.2 最小 frontmatter（mirror am-7 D2 fixture pattern）

```yaml
title: "[validation-fixture] download fileUrl invalid format"
slug: "test-download-fileurl-invalid-format"
status: "ready"
draft: false
date: "2026-05-30"
description: "am-12 fixture：故意觸發 download-fileurl-invalid-format warning。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["download"]
cover: "/images/placeholders/cover.png"
download:
  enabled: true
  fileUrl: "not-a-url"
  fileType: "PDF"
```

### 10.3 fileUrl 測試值建議

- 推薦：`"not-a-url"`（明顯虛假；mirror am-9 §10.2 與既有 fixture 紅線「不填真實 URL」）
- 可選替代：`"ftp://example.com/file.zip"`（命中 `^ftp://` 之常見錯誤；亦 mirror invalid-canonical 既有 pattern）
- **不**建議：`"/downloads/foo.pdf"`（root-relative；若未來改 Option B，會由 negative 轉 positive，造成 fixture 語意飄移）
- **不**建議：真實 Drive URL / 真實 share URL（屬 R2 紅線；fixture 應為明顯虛假值）

### 10.4 positive fixture 是否需要

- ❌ **不需要**。一般合法 https URL 為 implicit positive；既有所有未來 ready download post 之 `fileUrl: "https://..."` 皆為 implicit positive。
- mirror 既有 `book-*` / `related-links-*` fixture 之策略：只放 negative，不為合法情境另建 positive。

### 10.5 negative fixture 預期觸發 warning

- 預期觸發：`download-fileurl-invalid-format`（1 條 warning）。
- **不**預期觸發其他 download-* warning（per §9.1 D1 / D2 / D3 天然互斥）。

### 10.6 baseline 變動

- 若 am-12 只做 D3 source + 1 negative fixture：**44 → 45 / 39 → 40**。
- 若 am-12 額外 audit 既有 D1 / D2 fixture 不被 D3 額外觸發：實際 baseline 仍為 **45 / 40**（D1 fixture `fileUrl: ""` 不命中 D3 non-empty；D2 fixture `fileUrl: 123` 由 D2 接走，不進 D3 string branch）。

---

## 11. Risk Analysis

### 11.1 採 Option D 之 risks

| Risk | 評估 | 緩解 |
|------|------|------|
| 未來內部 asset 需求出現時，需新建 registry 才能支援 | 🟡 中：屬 architectural commitment，registry 設計成本不低 | registry 設計已有 docs trail（pm-16 / pm-20）；非新負擔 |
| 早期作者誤以為可填 `/downloads/foo.pdf` | 🟡 中：D3 warning 會提示；CLAUDE.md §13 / template 可補說明 | am-12 落地 PR / commit message 明示 D3 policy；template 內 comment 補說明（未來 docs sync phase）|
| Google Drive URL semantic edge cases（preview vs direct）放行 | 🟢 低：preview-url-risk 屬獨立 docs-only policy；不在 D3 範圍 | per am-9 §6.5 已 deferred |

### 11.2 若改採 Option B（root-relative）之 risks

| Risk | 評估 |
|------|------|
| Blogger render 端 root-relative 解析至 blogger.com，永遠 404 | 🔴 高：硬傷 |
| GitHub Pages custom domain 切換時 base 改變 | 🔴 高 |
| local dev / deploy 之 base 不一致 | 🔴 高 |
| 未來 registry 落地時與 root-relative policy 重複，需 migration | 🟡 中 |

### 11.3 若改採 Option C（repo-relative）之 risks

| Risk | 評估 |
|------|------|
| 瀏覽器不存在 repo root 概念；render HTML 內無 sane 解析 | 🔴 極高：天生不可用 |
| 需 build 端 rewrite；目前 download box render 為 raw passthrough | 🔴 高：建造成本不成比例 |

### 11.4 relative path 在不同平台解析不同

- 已於 §7 全面分析；屬 Option B / C 之核心硬傷；Option A / D 完全消除。

### 11.5 過早允許 relative path 造成無效下載連結被放行

- 採 Option A / D → 不發生（D3 直接 warning，作者可早期察覺）。
- 採 Option B / C → 發生機率高（特別是 Blogger render 端）。

### 11.6 過嚴 `^https?://` 造成未來內部 asset 支援需要再調整

- ✅ **可接受**。Option D 即明示「未來 internal asset 由 registry 承載」，D3 regex 即使長期亦保持 `^https?://`；未來不需調整 D3，只需新增 registry rules。

### 11.7 D3 與 preview-url-risk 混在一起會讓規則不穩

- ✅ 已避免：per am-9 §6.5；本 phase 不變動。

### 11.8 D3 source implementation 若無 fixture 會缺 regression protection

- ✅ 已 mitigation：am-9 §10.1 明示 D3 source + fixture 必須同 PR；本 phase 沿用。

---

## 12. Recommended Phase Split

> **保守 phase split**；每步皆 additive、可獨立驗證、可 dormant；任一步皆須**獨立 phase + user explicit approval**。

| 序 | 候選 phase | 性質 | 涵蓋規則 | 是否本 phase 啟動 | 預期 baseline |
|---|-----------|------|---------|-----------------|---------------|
| **am-11（本 phase）** | `download-validation-fileurl-relative-path-decision-docs-only` | docs-only | D3 之 relative path 允許性裁決 | 🟡 **本 phase 完成新增** | 39 / 44 不變 |
| **am-12（建議下一 phase）** | `download-validation-fileurl-relative-path-decision-acceptance-read-only` | read-only | n/a（驗證 am-11 docs 內部一致性、與 am-7 / am-9 不衝突、與 build-blogger / build-github render 證據對齊） | ❌ 不啟動 | 39 / 44 不變 |
| **am-13** | `download-validation-d3-source-implementation` | source change（warning-only additive）+ 1 negative fixture | D3 only（採 B-strict per 本 phase 推薦） | ❌ 不啟動 | 預期 **45 / 40** |
| **am-14** | `download-validation-d3-source-implementation-acceptance-cross-check` | read-only | n/a | ❌ 不啟動 | 45 / 40 不變 |
| **am-15** | `download-validation-s1-s2-merge-decision-docs-only`（per am-9 §11） | docs-only | S1 / S2 合併與否裁決 | ❌ 不啟動 | 45 / 40 不變 |
| **am-16** | `download-validation-s1-s2-source-implementation` | source change + fixture | S1（合併版）或 S1 + S2（分離版） | ❌ 不啟動 | 預期 **46 / 41** 或 **47 / 42** |
| **am-17** | `download-validation-s1-s2-source-implementation-acceptance-cross-check` | read-only | n/a | ❌ 不啟動 | 不變 |
| later | `download-fileurl-preview-url-risk-docs-policy` | docs-only policy（不實作 validator）| preview-url-risk | ❌ 不啟動 | 不變 |
| later | `download-asset-registry-schema-acceptance` 系列 | docs-only → schema → registry file → loadSettings 串接 → F1 / F2 / A1 / A2 / A3 | F / A | ❌ 不啟動 | TBD |

### 12.1 明確聲明

- **不建議下一 session 直接實作 D3，除非 am-12（acceptance cross-check）通過且 user explicit approval。**
- 理由：
  1. am-12 為獨立 read-only acceptance，可單獨確認本 phase 與 am-7 D1 / D2 / am-9 / build-blogger / build-github render 證據不衝突；屬安全閘門。
  2. 若直接跳 am-13 source phase，會把「本 phase 之裁決是否與 render evidence 完全一致」與「D3 regex 是否正確落地」兩個 review concern 塞進同一 PR；屬不必要的混淆。
  3. 既有 cadence（am-5 → am-6 → am-7 → am-8 → am-9）已驗證「decision → acceptance → source + fixture → cross-check」之四步式為穩定 pattern。
- **若要 source implementation，必須另開 phase 並取得 explicit approval。**

### 12.2 推薦 next phase

**am-12**（read-only acceptance cross-check）→ 確認本 docs 內部一致 + 與 am-7 / am-9 / build-blogger / build-github render 證據不衝突 → 再進 am-13 之 D3 source。

---

## 13. Non-goals

本 phase 明確**不做**：

- ❌ no source implementation
- ❌ no `src/scripts/validate-content.js` change
- ❌ no fixture（不新增 `_test-*.md`）
- ❌ no content publish / no `draft → ready`
- ❌ no `download.fileUrl` fill
- ❌ no settings registry file creation
- ❌ no download landing page source
- ❌ no template 改動
- ❌ no deploy（不 `npm run build:*`、不 push gh-pages、不改 dist）
- ❌ no Blogger repost
- ❌ no GA4 validation
- ❌ no reverse UTM activation
- ❌ no pm-26 deploy gate unblock
- ❌ no Admin Apply enable
- ❌ no middleware write route enable
- ❌ no admin-write-cli dry-run / apply
- ❌ no fourth SEO write
- ❌ no `npm install`
- ❌ no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`
- ❌ no am-7 D1 / D2 implementation 變更
- ❌ no am-9 D3 / S1 / S2 decision doc 變更

本檔落地後 production state drift = 0；屬純 docs entry。唯一變更為新增本 docs 檔。

---

## 14. Final Recommendation

### 14.1 relative path 是否允許

- ❌ **不允許**。
- 採 **Option D**（per §6.1）：D3 之 regex 邊界為 `^https?://`；任何 internal / relative / repo-relative path 一律觸發 D3 warning；未來 internal asset 需求由 DownloadAsset registry 之 named reference 承載，**不**由 fileUrl raw string 自由填寫。

### 14.2 D3 第一版 regex 建議

- **B-strict（`^https?://`）**。
- 觸發範圍：ready / published only。
- D3 / D1 / D2 互斥（per §9.1）：D2 → D1 → D3，三者於同一 post 對 fileUrl 只 push 1 條。
- preview-url-risk 不進 D3；屬獨立 docs-only policy。

### 14.3 future internal asset support 應交給什麼機制

- **DownloadAsset registry**（per pm-16 §5 / pm-20 §13 既有 docs trail）。
- registry entry 內 explicit 記錄 `assetUrl` + `deliveryMode`；validator 對 registry-linked download 改檢查 registry consistency。
- registry 落地路徑由 am-9 §11 之 later phase 系列（registry schema → file → loadSettings → F / A rules）承擔；**不**屬本 phase。

### 14.4 下一步是否應先做 read-only acceptance cross-check

- ✅ **應先做**。建議下一 phase 為 **am-12 read-only acceptance cross-check**（per §12）。
- **不**建議直接跳 am-13 source implementation。

### 14.5 不得本 session 直接做 source implementation

- ✅ 本 phase 屬 docs-only decision preanalysis；嚴禁本 session 內修改 `src/scripts/validate-content.js` / 新增 fixture / 改 content / 改 settings。
- am-12 / am-13 / am-14 / am-15 / am-16 / am-17 等後續 phase 之啟動須由 user 明確 approve；本 phase 僅完成決策固化。

### 14.6 本 phase 與其他凍結之關係

- reverse UTM remains **dormant**；本 phase 不啟動。
- pm-26 deploy gate remains **BLOCKED**；本 phase 不解除。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**；本 phase 不啟動。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守：本 phase 不引入任何 respondent data 通路、不把 `download.fileUrl` 與 Google Form URL 混為一談、不另造 SEO pipeline。
- am-7 D1 / D2 implementation 保持 frozen；本 phase 不重做、不調整、不退化。
- am-9 D3 / S1 / S2 decision doc 保持 frozen；本 phase 僅在 am-9 §5.4 之 outstanding decision 內單題裁決，**不**改動 am-9 其他 §。

### 14.7 Final Idle Freeze / EXIT

完成本 phase（新增單一 docs 檔 + commit + push + final verify）後，**建議 Final Idle Freeze / EXIT**，不啟動任何 follow-on phase。

---

（本文件結束）
