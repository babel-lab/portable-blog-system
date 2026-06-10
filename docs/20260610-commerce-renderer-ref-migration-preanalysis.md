# Commerce Renderer Fallback + Production Content `raw URL → ref` Migration — Preanalysis

> **Phase**: `20260610-am-5-commerce-renderer-ref-migration-preanalysis-docs-only-a`
> **Mode**: **docs-only preanalysis**。只讀取 / 分析 / 文件化。**不**實作 renderer、**不**改 source、**不**改 posts、**不**改 registry、**不** deploy、**不**啟用 KOBO excluded entry、**不**自行開始下一 phase。
> **Created**: 2026-06-10 +0800（11:31 起始）
> **Baseline**: HEAD = origin/main = `4a48bbe`（`docs(commerce): record l1 seed acceptance checkpoint`）/ working tree clean / `npm run validate:content` = 0 errors / 69 warnings / 59 posts / overlay direct-node = 0 / 70 / 59。
> **Predecessor**: `docs/20260610-commerce-blogger-tongluwang-l1-seed-result.md`（L1 seed result）、`docs/20260610-commerce-l1-seed-acceptance-checkpoint.md`（L1 seed acceptance）、`docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（v0 schema）、`docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（C1–C9 content-ref rules）。

---

## A. 現況（Current state findings）

### A.1 production post 的 affiliate link frontmatter 寫法

目前 production 採 **raw inline** 寫法（**無** registry 參照）：

```yaml
affiliate:
  enabled: false            # 或 true
  disclosure: "本文包含聯盟行銷連結。…"
  position:
    top: false              # 或 true
    bottom: false           # 或 true
  links:
    - label: "博客來：實體書"
      network: "通路王"
      url: "https://whitehippo.net/3QaKr?uid1=blog"   # raw affiliate redirect URL（直接寫在文章）
    - label: "金石堂：實體書"
      network: "聯盟網"
      url: "https://adcenter.conn.tw/3QaLi?uid1=blog"
```

每個 link entry 之既有欄位 = `{ label, network, url }`（全 raw、全文章端自帶）。

### A.2 哪些文章仍使用 raw affiliate URL

掃 `content/**/*.md` 之 `affiliate` 區塊（read-only 盤點）：

| 檔案 | `enabled` | `draft` | `links` | 是否含 raw url | 目前是否 render affiliate box |
| --- | --- | --- | --- | --- | --- |
| `content/blogger/posts/20260515-we-media-myself2.md` | **false** | false | 2 筆 raw（`label`+`network`+`url`） | ✅ 2 筆 raw url（`whitehippo.net/3QaKr`、`adcenter.conn.tw/3QaLi`，皆 `uid1=blog`） | ❌ 否（`enabled:false` → guard 不過） |
| `content/blogger/posts/20260504-sample-book-review.md` | true | false | `[]`（空） | ❌ 無 | ❌ 否（`links` 空 → guard 不過） |
| `content/blogger/posts/20260525-draft-book-review.md` | true | **true** | `[]`（空） | ❌ 無 | ❌ 否（draft 不輸出 + `links` 空） |
| `content/templates/blogger-book-review-template.md` | — | — | template | template 範例 | ❌（template，不進 build） |
| `content/templates/blogger-magazine-review-template.md` | — | — | template | template 範例 | ❌（template，不進 build） |
| `content/validation-fixtures/blogger/posts/_test-commerce-ref-*.md`（6 檔） | — | — | fixture ref/url | fixture-namespaced（`example.invalid` / reserved） | ❌（fixture，僅 validator 掃） |

**關鍵事實：production 目前實際含 raw affiliate URL 的文章只有 `we-media-myself2.md`（2 筆），且其 `affiliate.enabled:false` → 目前 0 篇 production post 會 render affiliate box。** 兩個 redirect URL（`whitehippo.net/3QaKr`、`adcenter.conn.tw/3QaLi`）與 registry 第 5、6 筆 entry 之 `targetUrl` **完全一致**（`book-we-media-myself2-books-com-tw-physical-books` / `book-we-media-myself2-kingstone-physical-books`）。

### A.3 是否已有 `affiliate.links[].ref` convention

- **validator 端**：已支援。`validateCommerceRefs`（`src/scripts/validate-content.js:608`）對 `affiliate.links[i].ref` 實作 C1–C9 共 9 條 warning-only content-ref rule（C1 invalid-type / C2 empty / C3 not-found / C4 inactive / C5 duplicate / C6 ref+url coexist / C8 invalid-role / C9 display-override-risk；C7 missing-role = NO-GO 未實作）。
- **production 端**：**0 篇** production post 使用 `ref`（usage = 0）；唯一帶 `ref` 的 `.md` 為 6 個 validation-fixtures。
- **renderer 端**：**完全不支援 `ref`**（見 A.4）。

→ convention 在「驗證層」存在但「渲染層」與「內容層」皆未採用。registry（10 active entries）目前 **無任何下游 consumer**。

### A.4 renderer 目前如何處理 affiliate links

兩個 renderer 模板皆 **直接讀 `link.url`，不解析 `ref`**：

- **GitHub**：`src/views/pages/post-detail.ejs`（top `:76–90` / bottom `:172–186`）。5 條 AND guard（`affiliate && enabled && Array.isArray(links) && links.length>0 && position && position.top|bottom`）；render `<a href="<%= link.url %>" rel="sponsored nofollow noopener noreferrer" target="_blank" …><%= link.label %> <%= link.network %></a>`；含 inline GA4 `data-ga4-*` attrs（`link_url` = `link.url`、`provider` = `link.network`）。
- **Blogger**：`src/views/blogger/blogger-post-full.ejs`（top `:68` / bottom `:106`）。同 markup，render `href="<%= link.url %>"`（無 GA4 inline attrs）。

build 端（`src/scripts/build-github.js` / `build-blogger.js`）**無 affiliate resolver**：

- 既有 derived-render helper 只有 `deriveRenderedCrossLinks`（relatedLinks/otherLinks 跨站 UTM）與 `deriveRenderedDownloadLanding`（download landing registry resolve）。
- **無 `deriveRenderedAffiliate` / 無 ref→targetUrl 解析**。`post.affiliate.links` 原樣傳入 EJS，EJS 取 `link.url`。
- `build-github.js:790–792` 之 `commerceLinksPreview` 僅為 Admin **read-only preview**（pm-26），**非** renderer resolver，不影響文章輸出。

> **⚠️ 核心 gap（決定 phase 排序）**：renderer 只認 `link.url`。若文章端先移除 `url`、改填 `ref`（R3）而 resolver（R1）尚未落地 → EJS `href="<%= link.url %>"` 取到 `undefined` → 產出 `href="undefined"` 破連結。**因此 R1（resolver）必須先於 R3（migration）。** C6 `commerce-ref-direct-url-coexist` warning 文案本即提示「remove url **after** commerce registry renderer migration」（`validate-content.js:671`），與此排序一致。

### A.5 如何檢查 commerce registry 與 post refs

- **registry load**：`src/scripts/load-settings.js:65–66` —— `readJsonOptional('commerce-links.json', {commerceLinks:[]})` → unwrap 為 `settings.commerceLinks`（array；非 array → `[]`）；metadata（schemaVersion/updatedAt/notes）不暴露。`loadSettings()` 為 build / validate 共用入口。
- **registry-level 驗證**：`validateCommerceLinkRegistry`（R3–R14，warning-only，post loop 外單次）。
- **content-ref 驗證**：`buildCommerceLinkIdSet`（`:389`，linkId set，for C3）+ `buildCommerceLinkEntryMap`（`:409`，linkId→entry map，for C4/C9）→ 傳入 `validateCommerceRefs`（call site `:1541`）。
- **registry 現況**：schemaVersion 1 / 10 active / 0 held / 1 excluded（KOBO `book-rouhou-time-kingstone-ebook-books` 不在 registry）/ 全 `networkKey: books` / `targetUrl` 保留 `uid1=blog`。production 0 篇用 ref → C1–C9 對 production 全 0 觸發；69 warnings 全來自 validation-fixtures。

---

## B. 目標行為（Target behavior）

1. **文章端改用 `affiliate.links[].ref`** 指向 commerce-links registry 之 `linkId`（取代 raw `url`）。per-instance 可選 `role`（C8 enum）/ `labelOverride`（C9 風險，建議省略）/ `order`。
2. **renderer 解析 `ref` → registry entry 之 `targetUrl`**，輸出正確 affiliate redirect URL 作為 `href`。
3. **保留既有 affiliate redirect，不做 canonicalization**：resolver 取 registry `targetUrl` **逐字（verbatim）** 輸出；**`uid1=blog` 必須保留**；不轉博客來/金石堂 canonical 商品頁、不移除任何 query param。
4. **display label 來源**：預設用 registry `entry.displayLabel`（缺則 fallback `linkId`，**絕不** fallback `internalLabel`）；若 post 提供 `labelOverride` 則用之（C9 leak-equality 仍 warn）。`network` 顯示由 `entry.networkKey` 經 `affiliate-networks.json` 派生（通路王）。
5. **inactive / malformed / missing ref 錯誤策略（須明確）**：
   - `ref` 命中 `active:false` entry（C4 範疇）→ **resolver 不輸出該 link**（omit；不顯示破連結 / 不顯示空 href）；validator 已 warn。
   - `ref` not-found（C3）/ 空（C2）/ 非字串（C1）→ **resolver 不輸出該 link**（omit）；validator 已 warn；**resolver 絕不自行 fabricate URL**。
   - 過渡期 `ref` + `url` 並存（C6）→ resolver **以 registry `ref`→`targetUrl` 為唯一真實來源**（ignore raw `url`）；migration 完成後移除 `url`。
   - **KOBO / 金石堂電子書 excluded entry 不得啟用**：該 candidate 不在 registry → 任何指向它的 ref 必落 C3 not-found → resolver omit；**不得**為了渲染而把它 seed 進 registry。
6. **GA4 / reverse UTM 不混入**：本工作線只處理 ref→targetUrl 渲染；GA4 inline attrs 之 `link_url` 改用 resolved targetUrl 屬 R1 附帶，但**不**新增 reverse UTM、**不**改 GA4 event schema。

---

## C. 實作切分建議（最小安全切分；**不實作**）

> 通則：每個 phase 各自獨立 commit + 各自 read-only acceptance；**不得**跨 phase 連動授權；每 phase 前先 baseline verify；empty-ref production 須維持 byte-identical-modulo-builtAt 直到 R3。

### Phase R1 — renderer fallback / resolver source implementation

- **目的**：build 端新增 `deriveRenderedAffiliate(post, settings)`（mirror `deriveRenderedDownloadLanding` 之 derived-data pattern），resolve `ref`→registry entry，輸出 `{ href: entry.targetUrl, label, network, … }`；EJS 改讀 resolved 結果，raw `url` 維持 fallback。
- **允許修改檔案**：`src/scripts/build-github.js`、`src/scripts/build-blogger.js`、`src/views/pages/post-detail.ejs`、`src/views/blogger/blogger-post-full.ejs`、（若抽共用）新增 `src/scripts/<resolver>.js`（例如 reuse / extend `active-commerce-links.js` 的 read-only helper 思路，但**獨立新檔**）。
- **禁止修改檔案**：`content/settings/commerce-links.json`、`content/**/*.md`（含 posts / templates / fixtures）、`src/scripts/validate-content.js`（驗證行為不變）、`src/scripts/load-settings.js` production 行為、`package` / lockfile、`dist` / gh-pages。
- **驗收條件**：
  - 對「無 ref」之既有 ready/published post，GitHub `dist/` 與 Blogger `dist-blogger/` 輸出 **byte-identical-modulo-builtAt**（0 篇 production 用 ref → 0 篇行為改變）。
  - temp smoke（建臨時 post，ref 指向某 active linkId，build→grep→**刪檔還原**，**no commit**）證明 `href` = registry `targetUrl`（**含 `uid1=blog`，verbatim**）；`label` = `displayLabel`（缺則 linkId）。
  - inactive ref（指向 `active:false`，temp overlay 或 temp registry，**不改 production registry**）→ resolver omit，不產 `href="undefined"` / 空 href。
  - `npm run validate:content` 維持 0/69/59；overlay direct-node 0/70/59。
  - `build:github` 只寫 gitignored `.cache`（無 tracked / dist / gh-pages drift）。
- **rollback / stop condition**：任何既有 post 輸出非 byte-identical（除 builtAt）→ **stop**，revert R1 commits。production posts 全程未動 → revert 即完全復原；live 站不受影響（R1 不 deploy）。

### Phase R2 — validator rule 補強或 fixture

- **目的**：（可選）補 resolver-coupled fixture 證明 ref→targetUrl 行為與 inactive omit；或評估是否需新增 rule（目前 C1–C9 已覆蓋，**預設不新增 rule**，僅補 fixture）。
- **允許修改檔案**：`src/scripts/validate-content.js`（僅在確需新 rule 時；否則不動）、`content/validation-fixtures/**`、overlay fixture（`content/validation-fixtures/settings/**`）。
- **禁止修改檔案**：`content/blogger/posts/**`、`content/github/posts/**`、`content/settings/commerce-links.json`、renderer / build source、`package` / lockfile、`dist` / gh-pages。
- **驗收條件**：新增 fixture 觸發**預期**warning（baseline delta 明確記錄，例如 +N warnings / +N posts）；無 production 觸發；無真實 affiliate URL / token / tracking id（只 `example.invalid` + reserved + fixture-namespaced ref）。
- **rollback / stop condition**：baseline warning 數出現**非預期**變動 → stop，revert fixture commits。

### Phase R3 — production content migration `raw URL → ref`

- **前置 gate**：**R1 必須 landed + accepted**（resolver 已可 render ref）。否則禁止啟動。
- **目的**：把 production post（首批 = `we-media-myself2.md` 之 2 筆）之 raw `url` 改為 `ref`（指向 registry linkId）；過渡可先 ref+url 並存（C6 warn）再移除 url。
- **允許修改檔案**：`content/blogger/posts/**`、`content/github/posts/**`（僅 frontmatter `affiliate.links[]`）。
- **禁止修改檔案**：`content/settings/commerce-links.json`、`src/**`、`package` / lockfile、`dist` / gh-pages。
- **驗收條件**：
  - migrated post build 後 `href` = 原 raw url 對應之 registry `targetUrl`（**逐字相同，含 `uid1=blog`**）；render 結果與 migration 前之 raw-url 輸出**等價**（label / network / href 一致）。
  - C6 coexist warning 在移除 raw url 後消失；C3 not-found 不出現（ref 命中 registry）。
  - **`we-media-myself2.md` 之 `affiliate.enabled` 維持 false**（除非 user 另行決定啟用）→ 仍不 render；migration 僅換寫法不改顯示狀態（如要啟用顯示屬獨立決策）。
  - `npm run validate:content` 0 errors（warnings 變動記錄）。
- **rollback / stop condition**：href 與原 raw url 不一致 / `uid1=blog` 遺失 / 出現破連結 → **stop**，`git revert` 該 post commit（posts 為純資料，revert 安全）。

### Phase R4 — build / deploy / Blogger repost gate

- **前置 gate**：R1 + R3 landed + accepted；**user 明確核准 deploy**。
- **目的**：build `dist/` + push gh-pages（GitHub Pages）；Blogger 端 **手動重貼**（manual repost）migrated 文章 HTML。
- **允許修改檔案**：build 輸出（`dist/` / gh-pages branch，經正式 deploy 流程）；**無 source 改動**。
- **禁止修改檔案**：registry / src / posts（此階段不改內容）；**不**自動發 Blogger（無 API）；**不**動 GA4 / reverse UTM。
- **驗收條件**：GitHub Pages live 文章 affiliate href = registry targetUrl（含 uid1=blog）；Blogger 後台重貼後 live href 一致；user GA4 Realtime（若 user 願意）確認 click event 正常（**但 reverse UTM 仍 dormant**）。
- **rollback / stop condition**：live href 錯誤 → 回退 gh-pages 至前一 deploy；Blogger 重貼前一版 HTML。**此 phase 涉外、不可逆性高，須 user 逐步確認**（mirror pm-26 deploy gate 慣例）。

---

## D. 風險表（Risk table）

| # | 風險 | 說明 | 嚴重度 | 緩解 |
| --- | --- | --- | --- | --- |
| D1 | **targetUrl 不一致** | 文章 raw url 與 registry `targetUrl` 在過渡期可能 drift（registry 為 source-of-truth）。`we-media-myself2` 現況 2 筆 raw url 與 registry entry 5/6 **一致**，但未來新增易 drift。 | 中 | R1 resolver 以 registry `targetUrl` 為唯一來源；R3 移除 raw url；C6 warn 提示並存；migration 驗收逐字比對 href + `uid1=blog`。 |
| D2 | **ref mismatch / missing registry entry** | post 填 ref 但 registry 無對應（typo / 未 seed / KOBO）→ C3 not-found。 | 中 | resolver 對 not-found / inactive / 空 / 非字串 ref **一律 omit，絕不 fabricate**；validator C1/C2/C3/C4 warn；R3 前先跑 validate 確認 0 C3。 |
| D3 | **renderer fallback 影響既有文章** | resolver 若改動非 affiliate 路徑或 break guard → 既有輸出 drift。 | 低（現況 0 篇 render affiliate） | R1 驗收要求 empty-ref post byte-identical-modulo-builtAt；resolver 走 derived-data（不改既有 5 條 guard）；temp smoke 不 commit。 |
| D4 | **Blogger repost timing** | Blogger 為手動重貼；source landed ≠ live。migrated HTML 未重貼前 Blogger 仍顯示舊 raw url（其實一致，無害），但「已遷移」不等於「已上線」。 | 中 | R4 gate 與 R1/R3 分離；live 狀態以 Blogger 後台重貼 + GitHub Pages deploy 為準；沿用 pm-24/pm-26 dormant→deploy 慣例。 |
| D5 | **GA4 / reverse UTM 混入** | 誤把 GA4 event schema 改動 / reverse UTM 啟用塞進本工作線。 | 中 | 本工作線**僅** ref→targetUrl 渲染；GA4 inline attr 之 `link_url` 改 resolved targetUrl 屬 R1 附帶且不改 event 名 / 不加 UTM；**reverse UTM remains dormant；pm-26 deploy gate remains BLOCKED**。 |
| D6 | **KOBO excluded entry 誤啟用** | 為了渲染而把 KOBO `book-rouhou-time-kingstone-ebook-books` seed 進 registry，或文章 ref 指向它。 | 高（治理紅線） | KOBO **不得入 registry**（per L1 seed result §4.2）；指向它的 ref 必落 C3 → resolver omit；**任何 phase 皆不得 seed / 啟用 excluded entry**；registry 變更非本工作線範圍（須獨立 L2 seed gate + user YAML + approval）。 |
| D7 | **資安洩漏（internalLabel / token）** | resolver / log 誤輸出 `internalLabel` 或敏感值。 | 高（治理紅線） | display 只用 `displayLabel`（缺→linkId，**絕不** internalLabel）；C9 leak-equality 已 warn 且不 echo 值；resolver 不 log targetUrl 完整值於非必要處；registry 紅線（無 token/credential/commission/respondent data）不變。 |

---

## E. 不在本 preanalysis 範圍 / 維持 dormant

- **無**任何 source / posts / registry / fixture 變更（本 phase docs-only）。
- renderer resolver（R1）/ validator fixture（R2）/ content migration（R3）/ build·deploy·Blogger repost（R4）**全未實作**，各須獨立 phase + explicit approval。
- Admin picker / write-enabled Admin / Admin Apply / middleware / admin-write-cli：dormant。
- reverse UTM：dormant；pm-26 deploy gate：BLOCKED。
- KOBO / 聯盟網（`networkKey: affiliate-network`）candidate intake：not started（須 L2 seed gate）。
- C7 missing-role：deferred / NO-GO。C9 broader expansion：Option D / no expansion。
- `we-media-myself2.md` 金石堂 metadata label（聯盟網 → 通路王）mismatch：屬內容修正，未在本工作線（未來另開 phase）。

---

## F. References（read-only）

- `src/scripts/load-settings.js:65–66`（commerce-links loader unwrap）
- `src/scripts/validate-content.js:54–57`（C8 role enum）/ `:389`（buildCommerceLinkIdSet）/ `:409`（buildCommerceLinkEntryMap）/ `:608–737`（validateCommerceRefs C1–C9）/ `:1541`（call site）
- `src/views/pages/post-detail.ejs:76–90`（GitHub affiliate top）/ `:172–186`（bottom）
- `src/views/blogger/blogger-post-full.ejs:68–69`（Blogger affiliate top）/ `:106–107`（bottom）
- `src/scripts/build-github.js:415`（deriveRenderedCrossLinks）/ `:473`（deriveRenderedDownloadLanding）/ `:790–792`（Admin commerceLinksPreview，非 renderer）
- `content/blogger/posts/20260515-we-media-myself2.md:59–71`（唯一含 raw affiliate url 之 production post；`enabled:false`）
- `content/settings/commerce-links.json`（10 active entries；entry 5/6 `targetUrl` 對應 we-media-myself2 之 2 筆 raw url）
- `docs/20260610-commerce-blogger-tongluwang-l1-seed-result.md` §3/§4（seeded / excluded）、`docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（C1–C9）、`docs/20260607-commerce-c6-coexistence-warning-preanalysis.md`（C6）

---

*（本文件結束 — renderer ref migration preanalysis；docs-only；無 source / posts / registry / build 變更；R1–R4 各須獨立 phase + explicit approval；KOBO excluded entry 不得啟用；reverse UTM dormant / pm-26 BLOCKED。）*
