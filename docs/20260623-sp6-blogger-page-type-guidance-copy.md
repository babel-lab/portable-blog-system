# SP-6 — Blogger 特殊頁面類型 / indexing metadata 操作指引 copy（docs-only）

> Phase：`pm-sp6-blogger-page-type-guidance-copy-a`（2026-06-23）
> Baseline：`main @ c22451d`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，平台無關架構 preanalysis）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema lock + warning-only validator + fixtures）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，GitHub post-detail robots precedence）
> - `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4，inventory + binding decision）
> - `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a，listing selector + GitHub wiring）
> - `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a，sitemap selector + wiring）

本文件落地 preanalysis §6.4 之 **SP-6**：為**未來 Blogger 手動發文 / 重貼 / 檢查流程**提供「特殊頁面類型 + indexing / listing / sitemap / feed metadata」之**操作者（operator）/ 未來 Admin 指引 copy**。

> 🟢 **本文件為 docs-only 操作指引。SP-6 未改變任何 Blogger 輸出行為。**
> - **不**改 source / EJS template / build script / validator / Admin / content posts / settings / package / lockfile。
> - **不**改 Blogger generated HTML / copy-helper / publish-checklist 之輸出（彼為 EJS 生成物，屬 source behavior，本 phase 不碰）。
> - **不**改 robots meta / sitemap / listing 之線上效果。
> - **不**動 dist / dist-blogger / gh-pages / `.cache`。
> - **不** repost Blogger；**不**存取或宣稱存取 GA4 / AdSense / Search Console / Blogger / Drive 後台。
> - 本文件只在 user **主動**手動發文 / 重貼 / 檢查 Blogger 時被讀取參考。

對應上層：
- `CLAUDE.md` §11 文章類型（`contentKind`）／§16.4 cross-site／§21 SEO／§23 發布狀態／§24 Blogger 發布 URL 回填／§25 備份與搬家
- `docs/seo-indexing-rules.md`（indexing policy 總則；SEO-1/2/3）
- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP；本文件之指引可在該流程中參照，但本 phase **不**改該檔）
- `docs/checklists/blogger-publish-checklist.md`（單篇 post 發布 checklist）

---

## 1. Purpose（本指引目的）

### 1.1 這是什麼

本文件是**給人看的操作者 / 未來 Admin 指引文案**，說明 SP-1..SP-5 引入之**平台無關 metadata 維度**，使未來 Blogger 手動發文 / 重貼 / 檢查時能正確理解並標記：

| metadata 維度 | 一句話 |
|---|---|
| `pageType` | 這頁在資訊架構上是什麼角色（決定 index / listing / sitemap 預設） |
| `seo.indexing` | robots policy 之 single source（`index` / `noindex-follow` / `noindex-nofollow`） |
| `includeInListings` | 是否出現在站內列表（首頁 / post-list / 分類 / 標籤 / prev-next） |
| `includeInSitemap` | 是否進 sitemap.xml（override；safety 永遠優先） |
| `includeInFeeds` | 是否進訂閱 feed（**目前無 feed 消費端，預留**） |
| `platformPolicy` | 同一內容、不同平台不同 index 行為（合併情境用；目前 schema 已收但 renderer dormant） |
| `gatedDownload` | 閘門下載描述子（如內嵌 Google Form 後才給下載連結；**不得含任何 secret / 私有直連 / 表單回覆**） |

### 1.2 SP-6 未改變任何 Blogger 輸出行為

⚠️ **重要界定**：本 phase **只新增本指引文件**，不改 Blogger build / copy-helper / publish-checklist / robots / sitemap / listing 之任何輸出。Blogger robots 仍由作者**在 Blogger 後台手動設定**（系統對 Blogger 端只提供 read-only guidance，不能 inject head robots meta，per SP-1 §1.3）。

### 1.3 為什麼現在就要寫這份指引

per SP-1 §1.2 / `CLAUDE.md` §1 / §25：一個已在 Blogger 後台手動設為 NO INDEX 的頁面（如下述 Google Form gated download 頁），其「不索引」保證**目前只存在於 Blogger 後台人工設定，repo 內無任何記錄**。一旦未來 Blogger / GitHub Pages / 新網域內容**合併**，該保證**不可攜（non-portable）**，可能**意外變成可索引 / 意外進入列表 / 意外進 sitemap**。本指引使操作者在發文 / 檢查時就能把這種頁面的索引狀態**顯式記錄為可攜 metadata**。

---

## 2. Blogger 特殊頁面檢查清單（operator checklist）

> 任何 Blogger 特殊頁面——**尤其是內嵌 Google Form 的 gated download 頁**——操作者在發布 / 重貼 / 例行檢查時，應逐項確認：

### 2.1 頁面類型判定

- [ ] 這頁是哪一種 `pageType`？
  - `article`（正式文章，預設）
  - `static_page`（靜態頁：About / 工具目錄 / 下載索引頁）
  - `download`（直接下載頁，無閘門）
  - `gated_download`（閘門下載頁：表單 / 互動後才給資源，含 Google Form 案例）
  - `landing`（著陸 / 推廣 / 導流前導頁）
  - `utility_hidden`（工具 / 隱藏頁：preview / test / 內部工具）
  - `redirect_canonical`（純跳轉 / canonical 載體頁）
  - `platform_special`（平台特殊頁，預留）

> ⚠️ `pageType`（內容語意）與 `contentKind`（體裁）與 `blogger.type`（平台 post/page）為**三個獨立維度**，互不推導（per `CLAUDE.md` §11 / SP-2 §1）。

### 2.2 索引 / 列表 / sitemap / feed 四問

- [ ] **應被搜尋引擎索引嗎？**（`seo.indexing`：index / noindex-follow / noindex-nofollow）
- [ ] **應出現在 sitemap 嗎？**（`includeInSitemap`）
- [ ] **應出現在站內列表嗎？**（`includeInListings`：首頁 / post-list / 分類 / 標籤 / prev-next）
- [ ] **應出現在訂閱 feed 嗎？**（`includeInFeeds`；目前無 feed，預留）

> ⚠️ 此四者**彼此正交**：可以「index 但不入列表」（某些 landing），也可以「noindex 但仍入列表」（罕見、危險，validator 會 warn）。`includeInSitemap: true` **不得**把 noindex / download 頁強塞進 sitemap——safety 永遠優先（SP-5a §D）。

### 2.3 gated / 嵌入流程與安全

- [ ] 這頁是否**內嵌 Google Form / Drive 下載流程**？若是 → `pageType: gated_download` + `gatedDownload` 描述子。
- [ ] 這頁是否**洩漏任何 secret / token / 私有直連 URL / 表單回覆資料**？**絕對不可**（red line，見 §5）。
- [ ] **Blogger 後台之 noindex 狀態，是否與 repo metadata 對齊？**（Blogger 後台手動 NO INDEX 屬不可攜設定；repo 須以 `seo.indexing` / `platformPolicy.blogger.indexing` 記錄同一事實）。

---

## 3. 建議 metadata 範例（僅供文件參考，**不**為 content file）

> ⚠️ 以下 YAML 為**文件示意**，**不**代表 repo 內存在這些 content file（目前無任一 production post 使用 `pageType` / `includeIn*` / `gatedDownload`，per SP-4 inventory §D.3）。範例**不含**任何 secret / 私有直連下載 URL / 表單回覆。

### 3.1 一般文章（normal article）

```yaml
# 預設姿勢：多數頁只需這兩個維度（其餘走推導 / 預設）
pageType: article
seo:
  indexing: index
# includeInListings 缺省 → 入列表（預設保底）
# includeInSitemap  缺省 → 入 sitemap（eligible 時）
```

### 3.2 既有 download 文章（如 `portable-blog-system-mvp`）

```yaml
# 現況：唯一 visible download post（github, ready）
contentKind: download          # legacy 體裁
seo:
  indexing: noindex-follow      # explicit（亦為 SEO-1 download fallback 同向）
# 行為（per SP-4a / SP-5a binding §H.3）：
#   - 保留在站內列表（home / post-list / category / tag / prev-next）
#   - sitemap 維持排除（download 且非 explicit index）
#   - listing 與 sitemap 正交：listing 留、sitemap 排除，兩者並存
```

> ⚠️ **legacy `contentKind: download` 不會自動退出列表**（SP-4a selector 不讀 `contentKind`）。若未來要讓 legacy download 離開列表，須**另開 content migration / policy phase**，先確認 live impact（SP-4 §H.3 binding）。

### 3.3 Google Form 閘門下載頁（gated download）

```yaml
pageType: gated_download
seo:
  indexing: noindex-follow       # 或 noindex-nofollow，視是否要跟隨頁內連結而定
includeInListings: false         # 除非刻意要對外可見，否則不入列表
includeInSitemap: false          # 不進 sitemap
gatedDownload:
  mechanism: google-form         # 閘門機制（語意標記）
  postSubmitResource: drive-link # 表單送出後顯示之資源「類型」
  # ❌ 不存 formEmbedUrl 之 secret 參數 / ❌ 不存 Drive folder ID
  # ❌ 不存任何 token / 表單回覆 / 私有直連檔案 URL
platformPolicy:
  blogger:
    indexing: noindex-nofollow   # 記錄「Blogger 後台已 NO INDEX」之事實（使其可攜）
    includeInListings: false
```

> 🔴 **最高風險組合**：`gated_download` + `seo.indexing: index` —— 搜尋引擎會略過閘門 / 前導頁直達資源，破壞導流漏斗。validator 會 warn（`page-gated-download-indexed`）；未來 Admin write-path 應 lock 或要求二次確認（SP-1 §5.3 / §5.4）。

### 3.4 工具 / 隱藏頁（utility_hidden）

```yaml
pageType: utility_hidden
seo:
  indexing: noindex-nofollow     # 不索引、不跟隨
includeInListings: false         # 不入列表
includeInSitemap: false          # 不進 sitemap
```

---

## 4. 中 / 英操作者標籤（供未來 Admin UI）

> 以下為**建議 label + 簡述 + 危險警示**，供未來 Admin write-path（目前 dormant）暴露欄位時參考（SP-1 §5.1）。SP-6 **不**實作任何 Admin UI。

| 欄位 | 中文 label | English label | 簡述 | 危險警示 |
|---|---|---|---|---|
| `pageType` | 頁面類型 | Page type | 此頁在資訊架構上的角色，決定 index / listing / sitemap 預設 | 改變類型可能連動改變索引 / 列表預設；務必複查生效值 |
| `seo.indexing` | 搜尋引擎索引 | Search indexing | robots policy 單一來源（index / noindex-follow / noindex-nofollow） | 將 gated / download 頁設為 `index` 會讓搜尋引擎略過閘門直達資源 🔴 |
| `includeInListings` | 顯示於列表 | Include in listings | 是否出現在首頁 / post-list / 分類 / 標籤 / prev-next | `noindex` 卻仍 `true` → 使用者會點進不被收錄的頁 🟡 |
| `includeInSitemap` | 列入 sitemap | Include in sitemap | 是否進 sitemap.xml（override） | `true` **不會**覆蓋 noindex / download 的 safety 排除（safety 優先） |
| `includeInFeeds` | 列入訂閱 | Include in feeds | 是否進訂閱 feed（**目前未啟用**） | 目前無 feed 消費端；標記僅為未來預留 |
| `gatedDownload` | 受控下載 | Gated download | 閘門下載描述子（機制 + 後段資源類型） | ❌ 嚴禁存 secret / token / 私有直連 / 表單回覆 🔴 |
| `platformPolicy` | 平台覆寫 | Platform policy | 同一內容於不同平台之 index / listing 差異 | 與頂層值矛盾時，務必確認是刻意的平台差異 |

---

## 5. Blogger 專屬警示

1. **Blogger 後台 NO INDEX 不可攜**：Blogger 後台手動設定的 noindex **只活在 Blogger 後台**，repo 無記錄。除非以 repo metadata（`seo.indexing` / `platformPolicy.blogger.indexing`）記錄同一事實，否則合併 / 搬家 / 重建後該保證會遺失（`CLAUDE.md` §25）。
2. **內嵌 Google Form 頁不得在遷移後意外變可索引**：此類頁面合併到 GitHub / 新網域時，若無 repo metadata 標記 `gated_download` + noindex，極可能**意外被索引、意外進列表 / sitemap**（SP-1 §1.1 最高風險頁）。
3. **絕不在 repo metadata 存敏感資料**：secret / token / 表單回覆 URL / Drive folder ID / 個資 / 私有直連檔案 URL **一律不得**寫進 frontmatter 或任何 metadata（對齊 download / commerce registry red line）。表單回覆永遠留在 Google Forms / Sheets，不進 repo。
4. **Blogger 後台設定與 repo metadata 可能分歧**：兩者由不同流程維護，可能不一致。未來檢查 / 重貼流程應**比對兩者**（Blogger 後台 robots 自訂標頭 vs repo `seo.indexing` / `platformPolicy.blogger`），分歧時以人工複查為準。

---

## 6. 實作備註（implementation notes）

- 本文件為 **docs-only**；SP-6 不改任何 source / 輸出行為。
- **未來 Admin UI** 可能據 §4 暴露這些欄位（須先有 write-path 規劃；目前 Admin 為 dev-mode-only read-only，Apply 永久 disabled）。
- **未來 Blogger repost packet** 可在重貼步驟中加入「metadata 對齊提醒」（比對 Blogger 後台 noindex vs repo metadata）。本 phase **不**改既有 repost packet / checklist。
- 任何 metadata 變更**不得靜默翻轉** indexing / listing / sitemap 行為——所有消費端（SP-3 / SP-4a / SP-5a）皆 explicit > 推導 > 預設保底，且預設輸出 byte-identical。
- **已知 Blogger Google Form 下載頁之正式遷移**（將其建模為 repo content + metadata）須**另開獨立 phase + 人工複查**，先確認 live impact；本 phase **不**新增該頁為 content file。

---

## 7. Validation results

| 量測 | before | after | Δ |
|---|---|---|---|
| `git status`（working tree） | clean（除新 doc） | 僅新增本 doc | 1 docs 檔 |
| `npm run validate:content` | 0 error / 104 warning / 94 post | 0 error / 104 warning / 94 post | 無漂移 |
| `node src/scripts/check-page-type-validator.js`（SP-2） | 20 / 0 | 20 / 0 | — |
| `node src/scripts/check-page-type-robots.js`（SP-3） | 29 / 0 | 29 / 0 | — |
| `node src/scripts/check-include-in-listings.js`（SP-4a） | 16 / 0 | 16 / 0 | — |

> SP-6 純新增 1 docs 檔 → 上述量測 by construction 不變。

---

## 8. What was NOT done（本 phase 邊界）

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 改 `src/**`（build / validator / EJS / Admin / helper） | ❌ 未動 |
| 2 | 改 Blogger generated HTML / copy-helper / publish-checklist 輸出 | ❌ 未動（彼為 EJS source behavior） |
| 3 | 改 robots meta / sitemap / listing 之線上效果 | ❌ 未動 |
| 4 | 改 `content/**` / `settings/**` / 新增任何 page content（含 Google Form 頁） | ❌ 未動 |
| 5 | 改 `package.json` / lockfile / `dist*` / `gh-pages` / `.cache` / 生成 HTML | ❌ 未動 |
| 6 | 執行 build / deploy / preview / repost / dev server | ❌ 未執行 |
| 7 | Blogger repost | ❌ 未做 |
| 8 | 存取 / 宣稱存取 GA4 / AdSense / Search Console / Blogger / Drive 後台 | ❌ 無 |
| 9 | 改 Admin write path | ❌ 未動（仍 dormant） |
| 10 | 改 `CLAUDE.md` / `MEMORY.md` | ❌ 未動 |
| 11 | 對既有 Blogger operator / checklist doc 之 additive 編輯 | ❌ 未做（僅 cross-link；新指引獨立成檔） |
| 12 | 啟動 SP-7（platformPolicy）/ SP-8（Admin）/ SP-9（feed）任一實作 | ❌ 未做 |

---

## 9. Final git state

- 新增 1 檔：`docs/20260623-sp6-blogger-page-type-guidance-copy.md`（本檔）。
- 其餘 working tree 維持 clean；無 source / content / settings / dist / gh-pages / `.cache` 變動。
- 建議 commit subject：`docs(blogger): add page type guidance checklist`。

---

## 10. Next recommended phase

- **SP-7**：`platformPolicy` 平台 override 子欄位 shape validator + 消費（合併站需求成形時；🔴 cross-platform 高風險）。
- **SP-8**：Admin 欄位暴露 + 危險組合防呆（須先有 write-path 規劃；目前 dormant）。
- **SP-9**：`includeInFeeds` + feed builder（僅合併站引入 feed 時）。
- 已知 Blogger Google Form 下載頁之**正式內容遷移**須**另開獨立 content / policy phase** + 人工複查。

## 11. Exit / idle freeze recommendation

- SP-6 為 docs-only 指引，無行為變動 → 完成後建議 **idle freeze**。
- 不主動推進 SP-7/8/9；不主動 build / deploy / repost / 動 Google 後台 / 改 CLAUDE.md / MEMORY.md。

---

## Cross-links
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a）
- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP；本指引可於該流程參照）
- `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`（noindex / download SEO policy）
- `docs/seo-indexing-rules.md`（indexing policy 總則）
- `CLAUDE.md` §11 / §16.4 / §21 / §23 / §24 / §25

（本文件結束）
