# SP-9c — Blogger `platformPolicy` / special `pageType` operator guidance（docs-only）

> Phase：`20260624-sp9c-blogger-platform-policy-operator-guidance-a`（2026-06-24）
> Baseline：`main @ 29232b4`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，平台無關 preanalysis）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema + validator + fixtures）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，GitHub robots precedence）
> - `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
> - `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a，listing selector）
> - `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a，sitemap selector）
> - `docs/20260623-sp6-blogger-page-type-guidance-copy.md`（SP-6，Blogger operator labels + 範例 YAML + 危險警示）
> - `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md`（SP-7a，Admin read-only summary）
> - `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8，platformPolicy shallow shape validator）
> - `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a，effective hint helper；source-light / display-only）
> - commit `29232b4` — `feat(policy): enforce github platform precedence (SP-9b)`（GitHub Pages 三 selector tighten-only / safety-first / top-level-first）

本文件落地 SP-9a §6 中之 **SP-9c**：為**未來 Blogger 手動發文 / 重貼 / 例行檢查 / 跨平台合併**情境，提供「特殊 `pageType` × `platformPolicy.blogger.*`」之**操作者（operator）人工 SOP 文案**。SP-6 已給操作者 label 與 metadata YAML 範例；本文件補上**Blogger 後台實際 UI 操作步驟**與**Blogger ↔ GitHub Pages / 新網域遷移檢查清單**。

> 🟢 **本文件為 docs-only 操作指引。SP-9c 未改變任何 source / Blogger 輸出行為 / 後台設定。**
> - SP-9c source 消費（`build-blogger.js` / `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 讀 `platformPolicy.blogger.*`）**仍 dormant**，須另開獨立 phase + 顯式批准。
> - 本文件只在 user **主動**手動發文 / 重貼 / 檢查 Blogger / 規劃合併時被讀取參考。

---

## 1. Scope & non-actions

### 1.1 SP-9c 本文件做了什麼

- 新增 1 docs 檔（本檔），內容為 Blogger operator 人工 SOP + pageType 矩陣 + `platformPolicy.blogger.*` audit 慣例 + Blogger ↔ GitHub 遷移 checklist。
- 補上 SP-6 未涵蓋之**Blogger UI 實際操作步驟**與**遷移路徑檢查清單**。

### 1.2 SP-9c 本文件**沒做**什麼（嚴格 dormant；違反即為 phase review 攔截）

- ❌ **不**改 `src/scripts/validate-content.js`（validator 行為 byte-identical；SP-2 / SP-8 / SP-9a / SP-9b 皆未動）
- ❌ **不**改 `src/scripts/page-type-robots.js` / `include-in-listings.js` / `include-in-sitemap.js`（SP-9b 鎖定之 GitHub-side 三 selector 行為 byte-identical）
- ❌ **不**改 `src/scripts/build-blogger.js`（Blogger build / dist-blogger 輸出 byte-identical）
- ❌ **不**改 `src/scripts/build-github.js` / `build-sitemap.js`（GitHub build 輸出 byte-identical）
- ❌ **不**改 `src/views/blogger/**`（含 `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` / `blogger-post-full.ejs`）
- ❌ **不**改 `src/views/admin/**`（Admin Platform policy `<dd>` 仍 display-only，per SP-9a）
- ❌ **不**改 `content/**`（不新增任何 page content；含不新增 Blogger Google Form 頁為 content file）
- ❌ **不**改 `content/settings/**` / schema / fixtures
- ❌ **不**改 `package.json` / lockfile / `dist*` / `gh-pages` / `.cache/` / 任何 generated HTML
- ❌ **不**執行 `npm run build*` / `dev` / `preview` / deploy / Blogger repost
- ❌ **不**碰 Blogger 後台 / GA4 / AdSense / Search Console / Google Drive / Google Form 後台
- ❌ **不**啟用 Admin write path / `dryRun:false` / `--apply`
- ❌ **不**新增列舉值；**不**動 SP-2 / SP-8 列舉 set
- ❌ **不** force-push / amend / rebase
- ❌ **不**改 `MEMORY.md` / `memory/**`
- ❌ **不**改 `CLAUDE.md`（無 §3a baseline 漂移；無 inventory 變動；無 Phase status 變動）

### 1.3 SP-9c **不解決**的問題

- 🔴 **Blogger source consumption 仍 dormant**：即使作者依本文件填齊 `platformPolicy.blogger.*`，`build-blogger.js` / `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 之輸出**仍完全不變**。實際 Blogger 線上行為**仍由作者在 Blogger 後台手動設定為準**。
- 🔴 **Blogger 自動 sitemap / feeds 不可完全控制**：Blogger 平台之 feed / sitemap 由 Blogger 自動生成，repo 與系統皆**無法**從外部關閉。本文件僅說明可控與不可控之邊界，不提供「強制排除」機制。
- 🔴 **Blogger label / auto-listing 不可完全控制**：Blogger 之 label 頁、首頁、archive 由平台自動聚合，repo `includeInListings` **不**影響 Blogger 端列表。本文件僅建議 label naming convention，不保證隱藏。
- 🔴 **跨平台合併 / 新網域時行為**：當 Blogger 內容遷移到 GitHub Pages 或新網域，SP-9b GitHub-side 才會實際消費 `platformPolicy.github.*`；`platformPolicy.blogger.*` **永遠**屬 audit / 文件化 metadata，不影響任何 build 輸出（直至另行批准之 phase 才接消費）。

---

## 2. Blogger gated download / Google Form noindex 人工 SOP

> ⚠️ **as of 2026-06-24，Blogger UI 路徑與字串以下為近期觀察，平台可能隨時變動**。若實際介面與下述不符，請以 Blogger 官方 Help 或當下介面為準；本文件不假裝路徑永久固定。

### 2.1 適用對象

- 內嵌 Google Form 之 gated download 頁（表單送出後給下載連結）
- 任何作者刻意不希望被 Google 索引之 Blogger 頁面（preview / utility / archive / 法律必要 noindex）
- 任何 `pageType: gated_download` / `download` / `utility_hidden` / `redirect_canonical` 之 Blogger post / page

### 2.2 SOP 步驟（per-post / per-page，as of 2026-06-24）

操作前提：作者已登入 Blogger 後台、已選擇正確 blog。

1. **確認站台層級 robots 自訂標頭已啟用**
   - Blogger 後台 → 設定（Settings）→ 抓取工具與索引（Crawlers and indexing；舊版翻譯可能為「搜尋偏好設定」/「Search preferences」）。
   - 確認「啟用自訂 robots 標頭標記 / Enable custom robots header tags」=「是 / Yes」。若未啟用，per-post 標頭設定不會生效。
   - 此為**站台層級一次性開啟**，已開啟者跳過。
2. **進入要 noindex 之 post / page 編輯頁**
   - 「文章 / Posts」（或「頁面 / Pages」）→ 點開該 post / page → 進入編輯介面。
3. **設定該頁之 robots 標頭**
   - 右側欄（或文章設定欄）→ 找到「自訂 robots 標頭標記 / Custom robots header tags」（位置與其他「標籤 / Labels」、「永久連結 / Permalink」、「位置 / Location」並列；2026 介面位於右側欄底部）。
   - 勾選 `noindex`（不索引）+ `nofollow`（不跟隨）；視場景判斷是否同時勾選 `noarchive`。
   - **`gated_download` / `utility_hidden` 一律建議 `noindex + nofollow`**；`download` / `redirect_canonical` 建議 `noindex + follow`（保留 PageRank flow），詳見 §3 矩陣。
4. **儲存並更新（Update / Publish）**
   - 點儲存 / 更新；若該 post 已 live，會立即重發布。
5. **人工驗證（必做；不可跳過）**
   - 開啟該 post live URL（無痕分頁避免 cache）。
   - 用 `view-source:` 或瀏覽器 DevTools「檢視原始碼 / View Source」搜尋 `<meta name="robots"`，確認包含 `noindex` 與 `nofollow`（或預期設定）。
   - 若未出現預期 robots tag → 回 §2.2 步驟 1 確認站台層級已開啟自訂 robots 標頭；或回步驟 3 確認該 post 之 robots 標頭已勾選並儲存。
   - **驗證證據建議留底**：截圖 view-source 之 `<meta name="robots">` 行 + Blogger UI 該 post 之 robots 標頭勾選狀態。

### 2.3 操作後在 repo 同步 metadata（audit record；可選但強烈建議）

完成上述 Blogger UI 設定後，建議在對應 `.md` frontmatter 同步寫入 `platformPolicy.blogger.indexing`（如 `noindex-nofollow`）作為**audit record**。此 metadata：

- ✅ **不會**改變 Blogger 線上輸出（Blogger 後台仍是 source of truth）
- ✅ **不會**改變 GitHub Pages 輸出（GitHub 只讀 `platformPolicy.github.*`）
- ✅ **會**記錄「該 Blogger 頁已人工設為 noindex」之事實，使其在未來合併 / 搬家 / 重建時可攜
- ✅ **會**在 Admin Platform policy `<dd>`（SP-9a 已 landed）顯示為 read-only effective hint

### 2.4 反例 / 已知陷阱（as of 2026-06-24）

- 🟡 **只在 post 設 robots 標頭但站台層級未啟用** → 不生效，Blogger 仍以平台預設或主題預設輸出 robots meta。
- 🟡 **依賴主題 `<head>` 修改 robots 而非 Blogger UI** → 主題改版 / 還原時會回退；非 portable 設定。
- 🟡 **誤以為 Blogger label = noindex 機制** → 完全錯誤；label 是分類，不是 robots policy。Blogger label 頁本身可能被索引。
- 🟡 **設了 robots 但忘了驗證 view-source** → 無證據，未來合併時無法確定當時 Blogger live 設定。

---

## 3. pageType × Blogger backend guidance matrix

> 以下矩陣為 **operator 人工 SOP**，**不**代表系統自動行為。`pageType` 與 `contentKind`（體裁）與 `blogger.type`（平台 post/page）為**三個獨立維度**（per `CLAUDE.md` §11 / SP-2 §1）。`platformPolicy.blogger.*` 屬 **audit record / future merge hint**，不影響任何 build 輸出。

| `pageType` | Blogger backend expectation | robots / noindex expectation | sitemap / feed caveat | listing / label caveat | future GitHub / new-domain behavior（合併時）|
|---|---|---|---|---|---|
| `article` | 一般文章；無特殊 robots 設定 | `index, follow`（預設） | 進 Blogger feed / sitemap；正常 | 出現於 Blogger label / 首頁 / archive | GitHub 端為 default include / index（SP-9b 三 selector 預設） |
| `static_page` | Blogger Page（非 Post）；無特殊 robots | `index, follow`（預設） | Page 不會進 Blogger 一般 post feed；但仍可被 Google 索引 | 不會出現在 Blogger label 頁（Page ≠ Post） | GitHub 端視為 page；listing 視 `includeInListings` 決定 |
| `download` | 直接下載頁 / 下載 landing；建議 `noindex, follow` | `noindex, follow`（保留 PageRank flow） | 建議在 Blogger 後台 noindex；Blogger feed 仍可能列；無法完全排除 | 建議避免放入常用導覽 label；視作者 SEO 漏斗決定 | GitHub 端 `contentKind: download` 既有 SEO-1 fallback → `noindex, follow`；sitemap 排除（SP-5a `isSitemapEligible`） |
| `gated_download` | 內嵌 Google Form / 表單後給下載；**必須**手動 `noindex, nofollow`（per §2） | `noindex, nofollow`（漏斗閘門 + 不傳遞權重） | 必須在 Blogger 後台 noindex；Blogger feed 仍可能列；無法完全排除 | **強烈建議**避開公開導覽 label；可用 internal/special label naming（per §6.4） | GitHub 端 `pageType: gated_download` → SP-3 derive `noindex, follow`；遷移時需重新評估是否仍要 `nofollow` |
| `utility_hidden` | 預覽 / test / 內部工具頁；**必須**手動 `noindex, nofollow` | `noindex, nofollow`（不索引 + 不跟隨） | 必須 noindex；Blogger feed 仍可能列；無法完全排除 | **強烈建議**避開所有公開 label；建議 unpublish 或設為僅作者可見 | GitHub 端 `pageType: utility_hidden` → SP-3 derive `noindex, nofollow`；listing 預設仍 include，需手動 `includeInListings: false` |
| `redirect_canonical` | 純跳轉頁 / canonical 載體；**必須**手動 `noindex, follow` | `noindex, follow`（保留 follow 傳遞 PageRank） | 必須 noindex；不應入 sitemap | 不應出現在公開導覽 | GitHub 端 `pageType: redirect_canonical` → SP-3 derive `noindex, follow`；canonical 必 explicit（SP-2 validator `page-redirect-canonical-missing-target`） |
| `landing` | 推廣 / 著陸 / 導流前導頁；通常 `index, follow` | `index, follow`（除非有特殊理由） | 可進 sitemap | 視 campaign 決定是否進公開導覽 | GitHub 端 SP-3 不推導（沿用 default / explicit `seo.indexing`） |
| `platform_special` | 平台特殊頁；本欄目前**預留**，無一致語義 | 視作者刻意定義；無預設推導 | 視作者決定 | 視作者決定 | GitHub 端 SP-3 不推導（沿用 default / explicit `seo.indexing`） |

> 🔴 **最高風險組合：`gated_download` + `seo.indexing: index`** —— 搜尋引擎會略過閘門 / 前導頁直達資源，破壞導流漏斗。validator 已 warn（`page-gated-download-indexed`，per SP-2）；本文件再次強調此為最高風險組合，operator 絕不可放任。

---

## 4. `platformPolicy.blogger.*` metadata guidance

### 4.1 欄位字典（SP-8 鎖定之 shallow shape）

`platformPolicy.blogger` 為 plain object；以下為**目前允許之 nested key**（per SP-8 PLATFORM_POLICY_NESTED_KEYS lock）：

| 欄位 | 型別 | 允許值 | audit 用途 |
|---|---|---|---|
| `platformPolicy.blogger.indexing` | string | `index` / `noindex-follow` / `noindex-nofollow` / `inherit` | 記錄「Blogger 後台已人工設為哪種 robots」之事實 |
| `platformPolicy.blogger.includeInSitemap` | boolean | `true` / `false` / `'inherit'` | 記錄「希望此頁是否進 sitemap（合併後）」之意圖 |
| `platformPolicy.blogger.includeInListings` | boolean | `true` / `false` / `'inherit'` | 記錄「希望此頁是否進站內列表（合併後）」之意圖 |
| `platformPolicy.blogger.includeInFeeds` | boolean | `true` / `false` / `'inherit'` | 預留；目前無 feed 消費端 |
| `platformPolicy.blogger.canonical` | string | non-empty string | 預留；canonical override 真消費屬 SP-9 其他 dormant phase |
| `platformPolicy.blogger.note` | string | 任意 string | 預留；自由文字註記 |

> SP-8 validator 已對非法 shape / 型別 warn（`page-platform-policy-*`；fixtures 在 `content/validation-fixtures/github/posts/_test-page-platform-policy-*.md`）。

### 4.2 重要界定：metadata ≠ Blogger live output

🔴 **目前這些 frontmatter metadata 完全不會自動改 Blogger live output**：

- `build-blogger.js` / `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` **不讀** `platformPolicy.blogger.*`（per SP-9a §1.2 與 commit `29232b4` SP-9b 邊界）。
- Blogger live 線上行為**100% 取決於作者在 Blogger 後台手動設定**（per §2 SOP）。
- 即使作者寫 `platformPolicy.blogger.indexing: noindex-nofollow`，若未在 Blogger 後台同步勾選 noindex，**Blogger live 頁仍為 default index**。

### 4.3 為何仍要填這些 metadata

1. **可攜 audit record**：記錄「該 Blogger 頁當時被人工設為什麼」之事實。Blogger 後台設定**不可攜**（遷移 / 重建 / 平台關閉時消失）；repo metadata 是唯一**長期保存**之來源。
2. **未來合併 / 遷移 hint**：當該頁從 Blogger 遷至 GitHub Pages 或新網域時，SP-9b GitHub-side 三 selector 會消費 `platformPolicy.github.*`；屆時需把作者意圖（noindex / not-in-listings / not-in-sitemap）從 `platformPolicy.blogger.*` 轉寫至 `platformPolicy.github.*`（per §7）。
3. **Admin 顯示 effective hint**：SP-9a 已 landed 之 Admin Platform policy `<dd>` 會 read-only 顯示這些值（含 raw / effective / source 標示），協助作者確認當前 metadata 是否與 Blogger 後台對齊。
4. **驗證與審計**：未來檢查時可比對「repo metadata 寫的 noindex」vs「Blogger live view-source meta robots」是否一致；分歧即需人工 reconcile。

### 4.4 建議書寫慣例

- 設定 Blogger 後台 noindex **完成並 view-source 驗證**後，再寫入對應 `platformPolicy.blogger.indexing`。
- 若僅打算未來再設、但目前 Blogger live 還是 index，**不要**先寫 `noindex-*`（避免 metadata 與 live 不一致）。
- `inherit` 字串表示「沿用頂層 / default」；缺省與 `inherit` 在效果上等價（per SP-9a 純函式 `resolvePlatformPolicyValue` source 區分）。
- `platformPolicy.blogger.canonical` / `note` 屬預留；目前 build 端無消費，可填但不影響任何輸出。

---

## 5. Blogger sitemap / feeds independence

### 5.1 哪些是 Blogger 自動生成、本系統不控制

- **Blogger Atom / RSS feed**：`/feeds/posts/default` 等 URL，Blogger 自動生成。**無法**透過 repo metadata 排除單篇 post。
- **Blogger sitemap.xml**：Blogger 自動生成 `/sitemap.xml`，按 Blogger 平台規則收錄 post / page。**無法**透過 repo metadata 完全排除。
- **Blogger 自動 sitemap → Search Console**：Google Search Console 可掃 Blogger 平台之 sitemap；單篇 noindex 之 robots tag 是阻止索引之主要手段（per §2.2 步驟 3）。

### 5.2 repo metadata 與 Blogger feed / sitemap 的關係

- `includeInSitemap: false` 或 `platformPolicy.blogger.includeInSitemap: false` 在 repo 中**僅為意圖記錄**；對 Blogger 自動 feed / sitemap **無實質影響**。
- 唯一阻止 Google 索引單篇 Blogger 頁之可靠手段是 §2.2 之 Blogger 後台 robots tag。
- 系統 `build-sitemap.js` 只產生 **GitHub Pages 之 sitemap**（per `src/scripts/build-sitemap.js`），完全不觸碰 Blogger 平台。

### 5.3 結論

- **可控**：個別 post 之 Google 索引（Blogger 後台 robots tag）
- **不可控**：該 post 出現在 Blogger 自動 feed / Blogger 自動 sitemap / Blogger archive
- **唯一防線**：依 §2 SOP 做 per-post noindex + view-source 驗證

---

## 6. Blogger labels / auto-listings caveat

### 6.1 哪些是 Blogger 自動生成、本系統不控制

- **Blogger label 頁**（如 `/search/label/<label>`）：Blogger 自動聚合**所有**含該 label 之 post。
- **Blogger 首頁** / 文章列表 / archive：依 Blogger 主題自動顯示 post。
- **Blogger 「相關文章」/「熱門文章」widget**：依 Blogger 平台規則或 widget 設定自動顯示。

### 6.2 repo `includeInListings` 與 Blogger label 頁的關係

- `includeInListings: false` 或 `platformPolicy.blogger.includeInListings: false` 在 repo 中**僅為意圖記錄**；對 Blogger label 頁**無實質影響**。
- 此欄位是「系統 / 未來合併站之 listing 意圖」記錄，**不等於** Blogger backend listing suppression。
- 系統 `include-in-listings.js` selector（SP-4a + SP-9b）只影響 **GitHub Pages listing surfaces**（home / post-list / category / tag / prev-next）。

### 6.3 唯一能影響 Blogger label 頁的方式

- **不要把該 post 加上 label**（最直接）。若 post 完全不加 label，就不會出現在任何 Blogger label 頁；但仍可能出現在首頁 / archive。
- **使用 internal-only label naming convention**（per §6.4）：用一組固定前綴（如 `_internal-*` / `_hidden-*` / `_utility-*`），人工約定不放進主導覽選單。
- **設為 draft 或設定限定權限**：完全不發布；但 gated download 頁通常須 public live 才可用。

### 6.4 建議：internal / special label naming convention（人工約定）

如有需要在 Blogger 內部分類但避免出現於主導覽，建議：

| Label 前綴 | 用途 | 是否放主導覽 |
|---|---|---|
| `_internal-*` | 內部工具 / preview / test 頁分類 | ❌ 絕不放主導覽 |
| `_hidden-*` | 刻意隱藏之分類 | ❌ 絕不放主導覽 |
| `_utility-*` | utility_hidden 類頁面分類 | ❌ 絕不放主導覽 |
| 一般中英文名稱 | 正式內容分類 | ✅ 可放主導覽 |

> 此為**人工約定**，無自動 enforcement。建議在 `docs/checklists/blogger-publish-checklist.md` 之後續維護階段（非本 phase）將此 convention 補入 checklist。

### 6.5 結論

- **可控**：是否給 post 加 label（純人工決定）
- **不可控**：post 出現在 Blogger 自動首頁 / archive / 「相關文章」
- **建議**：special / noindex / download / gated_download / utility_hidden 類頁**避免**使用公開導覽 label；可用 `_internal-*` 等內部前綴

---

## 7. GitHub ↔ Blogger merge / migration checklist

### 7.1 當前狀態（2026-06-24）

- ✅ GitHub Pages 三 selector **已**消費 `platformPolicy.github.*`（per commit `29232b4` SP-9b，tighten-only / safety-first / top-level-first）
- ⏸ Blogger source **尚未**消費 `platformPolicy.blogger.*`（dormant；待另開 phase + 顯式批准）
- ⏸ `platformPolicy.blogger.*` 與 `platformPolicy.github.*` 為**獨立** namespace；無自動互相推導
- ⏸ 0 production posts 使用 `platformPolicy`；本文件僅為合併 / 遷移情境之 forward planning

### 7.2 Blogger → GitHub Pages 遷移檢查（per-post）

操作前提：作者已決定將某 Blogger post 遷至 GitHub Pages（或反向 / 至新網域）。

1. **盤點 Blogger live 現況**
   - [ ] view-source Blogger live 頁，記錄 `<meta name="robots">` 之實際值（含 / 不含 noindex / nofollow）。
   - [ ] 截圖 Blogger 後台「自訂 robots 標頭標記」勾選狀態。
   - [ ] 列出該 post 之 Blogger label。
   - [ ] 記錄 Blogger live URL（須 mirror 至 repo metadata 之 `blogger.publishedUrl`，per `CLAUDE.md` §24）。
2. **判定 pageType**
   - [ ] 該 post 之資訊架構角色？（per §3 矩陣選 `article` / `gated_download` / `download` / `utility_hidden` / `redirect_canonical` / `landing` / `static_page` / `platform_special`）
   - [ ] 是否內嵌 Google Form？若是 → 必為 `gated_download`，並沿用 §2 SOP 之 noindex 意圖。
3. **填寫 `platformPolicy.*` 雙平台 audit**
   - [ ] `platformPolicy.blogger.indexing` 記錄遷移**前** Blogger live 狀態（從步驟 1 view-source 結果）。
   - [ ] `platformPolicy.github.indexing` 記錄遷移**後**期望之 GitHub Pages 行為。
   - [ ] 若兩者不一致（例：Blogger 為 `noindex-nofollow`、GitHub Pages 期望 `noindex-follow`）→ 加 `platformPolicy.blogger.note` 與 `platformPolicy.github.note` 文字註記原因。
4. **驗證 GitHub Pages 端 effective 行為（SP-9b tighten-only / safety-first / top-level-first）**
   - [ ] `seo.indexing` 為 single source；`platformPolicy.github.indexing` 只能**收緊**，永不放寬 explicit noindex / `contentKind: download` / special `pageType`（per `src/scripts/page-type-robots.js` resolvePostDetailRobots）。
   - [ ] `includeInSitemap` top-level 與 `platformPolicy.github.includeInSitemap` 同向；safety 永遠優先（per `src/scripts/include-in-sitemap.js`）。
   - [ ] `includeInListings` top-level `false` 最高優先；`platformPolicy.github.includeInListings: false` 可額外排除（per `src/scripts/include-in-listings.js`）。
5. **canonical 與 cross-link 重新評估**
   - [ ] `canonical` 是否需從 Blogger URL 轉為 GitHub Pages URL？（per `CLAUDE.md` §21 / `docs/publish-json-schema.md` §5.3）
   - [ ] 既有 Blogger → GitHub Pages / GitHub Pages → Blogger 互導 UTM 是否仍合理（per `CLAUDE.md` §16.4）？
6. **Blogger 端處理（unpublish vs keep + redirect）**
   - [ ] 是否在 Blogger 端設 `redirect_canonical` 頁指向新 GitHub Pages URL？若是 → 加 `pageType: redirect_canonical` + canonical 必 explicit + Blogger 後台 noindex（per §2 SOP）。
   - [ ] 是否直接 unpublish Blogger 原 post？若是 → 影響 SEO 權重轉移；建議至少保留 30-90 天 redirect 期。
7. **驗證 GitHub Pages live**
   - [ ] `npm run build:github`（**僅在獨立批准之 build phase 執行**；本 SP-9c 文件 phase 不執行）
   - [ ] view-source GitHub Pages 新 URL，確認 `<meta name="robots">` 與意圖一致
   - [ ] 確認 sitemap.xml 與意圖一致
   - [ ] 確認 listing surfaces 與意圖一致

### 7.3 GitHub Pages → Blogger 遷移（罕見；保留以資完整）

實務上不常見（一般是 Blogger → GitHub 方向）；若需反向遷移，原則 mirror §7.2，但**特別注意**：

- Blogger 端 robots **仍需依 §2 SOP 人工**設定（系統不能 inject）。
- `platformPolicy.blogger.*` 仍屬 audit；Blogger live 行為 100% 取決於後台。
- canonical 應改指 Blogger URL（per Blogger primary 之 `publishTargets.blogger.enabled` + `primaryPlatform`）。

### 7.4 合併 / 新網域情境

- 當 Blogger + GitHub Pages 內容未來合併至同一網域：
  - SP-9b 三 selector 仍以 GitHub Pages 角度 consume `platformPolicy.github.*`；不會自動讀 `platformPolicy.blogger.*`。
  - 屆時需 per-post 評估**最終網域**之 robots / listings / sitemap 行為，並將 `platformPolicy.<final-platform>.*` 寫對應值。
  - 本文件僅為 forward planning；實際合併 phase 須另行 preanalysis + Dean 批准。

---

## 8. References & red lines

### 8.1 既有文件 / 規則交叉引用

**SP 系列**
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，平台無關架構）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema + validator + fixtures）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，GitHub robots precedence）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a，listing selector）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a，sitemap selector）
- `docs/20260623-sp6-blogger-page-type-guidance-copy.md`（SP-6，Blogger operator labels）
- `docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md`（SP-7，Admin metadata visibility preanalysis）
- `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md`（SP-7a，Admin read-only summary）
- `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8，platformPolicy shallow shape validator）
- `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a，effective hint helper）
- commit `29232b4` — `feat(policy): enforce github platform precedence (SP-9b)`

**SEO / publish / Blogger 既有規則**
- `docs/seo-indexing-rules.md`（SEO-1 / SEO-2 / SEO-3 總則）
- `docs/publish-bundle.md`（`.md` frontmatter / `.publish.json` 分離）
- `docs/publish-json-schema.md`（`.publish.json` schema；含 `blogger.type` / `blogger.publishedUrl` / canonical 規則）
- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP；本文件可在該流程中參照）
- `docs/checklists/blogger-publish-checklist.md`（單篇 Blogger post 發布 checklist）
- `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`（noindex / download SEO policy）

**CLAUDE.md 對應段落**
- §11 文章類型（`contentKind`）
- §16.4 cross-site 連結處理
- §21 SEO 規則
- §23 發布狀態
- §24 Blogger 發布 URL 回填
- §25 備份與搬家
- §29 第一版不做清單（含 Blogger API / Google Drive API / Google Form backend 自動化 = **永禁**）

### 8.2 Red lines（不可違反）

1. ❌ **永禁**自動 Blogger API 發文 / 改 robots / 改 label / 改 settings（per `CLAUDE.md` §29）
2. ❌ **永禁**自動 Google Drive API 上傳 / 移動 / 改權限（per `CLAUDE.md` §29）
3. ❌ **永禁**自動 Google Form backend 動作（讀回覆 / 改題目 / 改設定）（per `CLAUDE.md` §29）
4. ❌ **永禁**自動 Search Console / GA4 / AdSense 後台動作
5. ❌ **永禁**自動讀 / echo / commit Blogger 後台 password / OAuth token / credential
6. ❌ **永禁**讀 / commit Google Form responses / respondent 個資（per `CLAUDE.md` §3a Download red lines）
7. ❌ **永禁**在 frontmatter / metadata / docs / ledger 寫入 secret / token / private direct URL / 表單回覆 URL / Drive folder ID（per SP-6 §5.3）
8. ❌ 第一版**永禁**自動 social 發文 / 留言 / 會員 / 資料庫後端 / 真正後台登入（per `CLAUDE.md` §29）
9. ❌ SP-9c source consumption（`build-blogger.js` / `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 讀 `platformPolicy.blogger.*`）**dormant**，須另開獨立 phase + 顯式批准
10. ❌ 任何 Blogger / GA4 / AdSense / Search Console / Drive / Google Form 後台動作 = 各須獨立 phase + explicit approval

### 8.3 第一版維持「人工 / 文件化 guidance」之理由

- Blogger 平台無法 inject `<head>` 內 server-side metadata（無 plugin / middleware 入口）；唯一方式為作者人工於 Blogger 後台設定。
- 自動化任一 Google 服務後台（Blogger / GA4 / AdSense / Search Console / Drive / Form）皆牽涉長期 OAuth token 與 credential 維護，違反第一版**不過度工程化 + 可搬家 + 可備份**核心理念（per `CLAUDE.md` §1）。
- 本文件之 docs 化 SOP 即為作者唯一可靠之長期可攜記錄。

---

## 9. Validation results

| 量測 | before | after | Δ |
|---|---|---|---|
| `git status`（working tree） | clean | 僅新增本 doc | 1 docs 檔 |
| `npm run validate:content` | 0 error / 112 warning / 102 post | （未跑；docs-only 不影響 validator 結果） | by construction 不變 |
| `node src/scripts/check-page-type-validator.js`（SP-2） | 37 / 0 | （未跑） | by construction 不變 |
| `node src/scripts/check-page-type-robots.js`（SP-3） | 29 / 0 | （未跑） | by construction 不變 |
| `node src/scripts/check-include-in-listings.js`（SP-4a） | 16 / 0 | （未跑） | by construction 不變 |
| `node src/scripts/check-include-in-sitemap.js`（SP-5a） | 19 / 0 | （未跑） | by construction 不變 |
| `node src/scripts/check-platform-policy-effective.js`（SP-9a） | 40 / 0 | （未跑） | by construction 不變 |
| `node src/scripts/check-platform-policy-github-precedence.js`（SP-9b） | 36 / 0 | （未跑） | by construction 不變 |
| `git diff --check` | — | clean | — |

> SP-9c 純新增 1 docs 檔 → 上述 source / validator / smoke 量測 by construction 不變；本 phase 紀律不跑 build / smoke 以免 unnecessary `.cache` / generated output 變動。

---

## 10. What was NOT done（本 phase 邊界）

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 改 `src/**`（build / validator / EJS / Admin / helper） | ❌ 未動 |
| 2 | 改 Blogger generated HTML / copy-helper / publish-checklist 輸出 | ❌ 未動 |
| 3 | 改 GitHub Pages generated HTML / sitemap / listing 之線上效果 | ❌ 未動 |
| 4 | 改 `content/**` / `settings/**` / 新增任何 page content（含 Google Form 頁） | ❌ 未動 |
| 5 | 改 schema / validator / fixtures / production posts | ❌ 未動 |
| 6 | 改 `package.json` / lockfile / `dist*` / `gh-pages` / `.cache` / 生成 HTML | ❌ 未動 |
| 7 | 執行 `npm install` / build / deploy / preview / repost / dev server | ❌ 未執行 |
| 8 | 執行 `validate:content` / smoke harness（避免 `.cache` 漂移） | ❌ 未執行 |
| 9 | Blogger repost / 動 Blogger 後台 | ❌ 未做 |
| 10 | 存取 / 宣稱存取 GA4 / AdSense / Search Console / Blogger / Drive / Google Form 後台 | ❌ 無 |
| 11 | 改 Admin write path / `dryRun:false` / `--apply` | ❌ 未動（仍 dormant） |
| 12 | 改 `MEMORY.md` / `memory/**` | ❌ 未動（本 phase 非 memory-sync） |
| 13 | 改 `CLAUDE.md`（§3a snapshot / Phase status / inventory / Red lines / baseline）| ❌ 未動（無漂移；docs-only landing 不需 sync） |
| 14 | force-push / amend / rebase / 動 `origin/main` 以外的 branch | ❌ 未做 |
| 15 | 啟動 SP-9c source consumption（`build-blogger.js` / Blogger EJS 讀 `platformPolicy.blogger.*`） | ❌ 未做（dormant；須另開 phase + 顯式批准） |

---

## 11. SP-9c gap coverage（本文件涵蓋之 SP-9c preflight 識別出之 gaps）

| 編號 | preflight 識別之 gap | 本文件覆蓋章節 |
|---|---|---|
| A | Blogger gated_download / Google Form 後台 noindex UI walkthrough | §2 完整 SOP（步驟 1–5 + 驗證 + 反例陷阱）|
| B | special `pageType` Blogger backend mapping | §3 完整矩陣（8 種 pageType × 5 欄位）|
| C | Blogger 自動 sitemap / feed 排除可控邊界 | §5（5.1 / 5.2 / 5.3）|
| D | Blogger label / auto-listing 排除可控邊界 | §6（6.1 / 6.2 / 6.3 / 6.4 / 6.5）|
| E | GitHub ↔ Blogger 合併 / 新網域遷移 forward planning | §7（7.1 / 7.2 / 7.3 / 7.4）|
| F | `platformPolicy.blogger.*` audit record / future merge hint 慣例 | §4（4.1 / 4.2 / 4.3 / 4.4）|

---

## 12. Next recommended phase / idle freeze

- SP-9c 為 docs-only 操作指引，無 source / generated / Blogger backend 行為變動 → 完成後建議 **idle freeze**。
- **不**主動推進以下（各須獨立 phase + Dean explicit approval）：
  - SP-9c source consumption（`build-blogger.js` / `blogger-copy-helper.ejs` / `blogger-publish-checklist.ejs` 讀 `platformPolicy.blogger.*`）
  - `platformPolicy.canonical` 真消費
  - `includeInFeeds` + feed builder
  - production posts 真正使用 `platformPolicy`（須先 per-post 評估 live impact）
  - Blogger Google Form 下載頁正式內容遷移（須另開獨立 content phase + 人工複查）
  - ADMIN R2+ / write path / auto-fix / browser write
  - 任何 build / deploy / repost / Blogger / GA4 / AdSense / Search Console / Drive 後台動作

---

（本文件結束）
