# 2026-06-07 Commerce Renderer Fallback Contract — Preanalysis (docs-only)

Phase name: `20260607-night-9-commerce-renderer-fallback-contract-preanalysis-docs-only-a`
Date: 2026-06-07 20:44 +0800
Mode: **docs-only renderer fallback contract preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader change / no validator rule landing / no renderer implementation / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install`）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | R1-clean 7 條件 |
| night-20 `c1a6974` | empty registry implementation（settings-only） | `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []`；無下游 consumer |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | registry-level R1..R15 + content-reference C1..C9 之 rule contract 凍結 |
| night-25 `94a1d47` | commerce links registry-level validator source-only landing | `validate-content.js` 新增 11 條 registry-level rule |
| am-2 `89cbf75` | commerce-links registry fixture mechanism preanalysis | fixture mechanism = Option D（skip settings-level fixtures） |
| am-7 `（per docs filename）` | commerce-links content-reference validation preanalysis | C1..C9 content-reference rule contract 凍結 |
| am-10..12 + `39b89e3` | commerce links content-reference source landing（C1 / C2 / C3 / C5） | `validate-content.js` 新增 `validateCommerceRefs` + `buildCommerceLinkIdSet` |
| `5b81da6` | docs(claude) sync commerce content ref validator state | CLAUDE.md commerce content-ref validator 狀態同步 |
| night-2 `6aeee85` | commerce content-ref C1/C2/C3/C5 fixture preanalysis（docs-only） | 4 個 post-level fixture 之檔名 / frontmatter shape / 預期 warning / 預期 baseline / acceptance 凍結 |
| night-4 `149efdc` | commerce content-ref C1/C2/C3/C5 fixtures landing | 4 個 post-level fixture 落地；baseline 60/53 → 66/57 |
| `1b25b54` | docs(claude) sync commerce content ref fixtures state | CLAUDE.md commerce fixtures state 同步 |
| night-8 `（pre-night-9）` | post commerce content-ref next work triage（read-only） | triage primary recommendation = Final Idle Freeze / EXIT |
| **night-9（本 phase）** `（本 commit）` | **commerce renderer fallback contract preanalysis（docs-only）** | 凍結未來 commerce renderer 之 input contract / fallback behavior / output contract / validation 關係 / Admin / registry seed / future phase order / 紅線；**不**實作 renderer；**不**改 source / settings / fixtures / templates / production content / CLAUDE.md |

本階段唯一目的為：

> 在 C1/C2/C3/C5 source + fixtures 已 landed、empty registry 維持、0 篇 production 用 `ref`、renderer 仍 dormant 之現況下，**docs-only** 設計未來 commerce renderer 之 fallback contract，為下一階段（C6 coexistence warning、Admin picker、production migration）提供 renderer-side 前置設計；本檔**不**啟動其中任何一個。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改 `src/views/pages/post-detail.ejs`、**不**改 `src/views/blogger/blogger-post-full.ejs`、**不**改任何 production content / templates / fixtures / package / CLAUDE.md。

See also：

- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（empty registry R1-clean）
- `docs/20260603-commerce-links-validator-preanalysis.md`（registry-level + content-reference rule contract）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（fixture mechanism Option D）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（C1..C9 content-reference rule + ref data model + Admin / renderer 影響範圍標記）
- `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`（C1/C2/C3/C5 fixture 設計凍結）
- `docs/20260603-download-landing-page-renderer-preanalysis.md`（download landing page renderer preanalysis；本文件大量借鑑其 Renderer Responsibility Boundary / Registry Resolution / Red Lines cadence）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + download R-series cadence + 紅線）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §22（圖片素材）/ §27（修改紅線）/ §29（第一版不做清單）/ §30（最終樣貌）

---

## A. Executive Summary

### A.1 一句話結論

> **本文件只設計 renderer fallback contract，不做 implementation**：凍結未來 commerce renderer 之 input contract（讀什麼）/ fallback behavior（命中 / not-found / inactive / coexist / missing label 之決策）/ output contract（HTML / rel / target / class / GA4 / 反向 UTM 之邊界）；**不**碰 source / settings / templates / production content / CLAUDE.md / fixtures / package / dist / gh-pages；**不**啟動 C6 / Admin picker / registry seed / production migration / reverse UTM / pm-26 / build / deploy。

### A.2 本 phase 目的

- 為未來 `affiliate.links[].ref` → `commerce-links` registry resolve 成可渲染連結之 renderer 提供合約。
- 為 C6 coexistence warning、Admin picker、production migration 提供 renderer-side 前置設計，但**不**自動解封任何一個。
- 為「raw-only affiliate links 保留 fallback 渲染」與「ref-aware affiliate links 新增 registry-resolved 渲染」共存階段提供 contract，使 renderer 落地時可 fail-closed 不破現有文章。

### A.3 本 phase 嚴格邊界

- ❌ 不實作 renderer（不改 `post-detail.ejs` / `blogger-post-full.ejs` / 任何 EJS template）。
- ❌ 不改 `src/scripts/build-github.js` / `build-blogger.js` / `build-promotion.js` / `build-sitemap.js` / `validate-content.js` / `load-settings.js` / `load-posts.js` / `parse-markdown.js`。
- ❌ 不改 `src/views/` 任一 EJS / `src/styles/` 任一 SCSS / `src/js/` 任一 JS。
- ❌ 不改 `content/settings/commerce-links.json`（empty `[]` 維持）；不改 `content/settings/affiliate-networks.json`。
- ❌ 不改任何 production content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）。
- ❌ 不改 templates（`content/templates/`）。
- ❌ 不改 fixtures（`content/validation-fixtures/`；本檔不新增、不修改、不刪除任一 fixture）。
- ❌ 不改 CLAUDE.md（若需 sync renderer 狀態 → 另開 docs-sync phase）。
- ❌ 不改 `package.json` / `package-lock.json` / `vite.config.js`。
- ❌ 不執行 `npm install` / `npm run build*` / `npm run dev` / `npm run preview`。
- ❌ 不 build / deploy / Blogger repost / GA4 validation。
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate；不啟動 Admin Apply / middleware / admin-write-cli。
- ❌ 不 seed production registry；不放入真實 affiliate URL / merchant token / tracking id。
- ❌ 不啟用 C4 / C6 / C7 / C8 / C9 source；不啟動 C6 fixture。
- ❌ 不自動啟動下一階段。
- ❌ 不承接 20260606 壞損 NB 之任何資料或結果。

### A.4 立場 spoiler（詳見 §J）

- **Final Idle Freeze / EXIT 為本 phase 結束之預設**。
- renderer 之**設計邊界**相對清楚（既有 raw render path 已熟）；但 renderer 之**實作落地**需要 user 明確授權 + 前置條件凍結 + 紅線確認；本文件**不**完成其中任何一項。
- contract 採「append over rewrite」：未來 renderer 落地時應**新增 ref-aware branch**，**不**重寫現有 raw render path；ref 不可解析時 fail closed 並 fall back 至 raw 渲染或隱藏。

---

## B. Current Baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `1b25b54068b0e8f8a21a309cdd465f3cdc565729` |
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| latest subject（pre-commit）| `docs(claude): sync commerce content ref fixtures state` |
| `npm run validate:content`（pre-commit）| **0 errors / 66 warnings / 57 posts** |

### B.1 Commerce registry state

`content/settings/commerce-links.json`（per night-20 `c1a6974`，本 phase 不動）：

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

- empty registry（R1-clean 7 條件全部滿足）。
- 無任何 entry；無真實 affiliate URL；無 merchantKey / networkKey / linkId。

### B.2 Commerce loader state

`src/scripts/load-settings.js`（lines 59–66；per night-21 `78f1e9a`，本 phase 不動）：

- 以 `readJsonOptional('commerce-links.json', { commerceLinks: [] })` read-only 載入；缺檔 / parse error / `commerceLinks` 非 array → fallback `[]`。
- 暴露為 `settings.commerceLinks = []`（array；非 registry object）。
- metadata 欄位（`schemaVersion` / `updatedAt` / `notes`）**未**暴露。
- 無下游 consumer（renderer / Admin / build / templates 皆未 import）。

### B.3 Commerce validator state

- registry-level validator：11 條 warning-only rule landed（R3..R9 / R11..R14；per night-25 `94a1d47`）。
- content-reference validator：C1 / C2 / C3 / C5 landed via `validateCommerceRefs` + `buildCommerceLinkIdSet`（per `39b89e3`；call site：post loop 內）。
- C4 / C6 / C7 / C8 / C9：**未**啟動（source 不存在）。
- 4 個 post-level fixture（C1 / C2 / C3 / C5）已 landed（per night-4 `149efdc`）；baseline +6 warnings / +4 posts。

### B.4 Production state

- production posts 用 `affiliate.links[].ref` 之文章數：**0**。
- 既有 3 篇有 `affiliate:` 區塊之 production post 皆為 `links: []`（空 array）；無一篇用 ref：
  - `content/blogger/posts/20260504-sample-book-review.md`（`affiliate.links: []`）。
  - 其餘有 `affiliate:` block 之 post 皆同。
- production renderer 端（`post-detail.ejs` lines 76–91 / 172–186；`blogger-post-full.ejs` lines 61–69 / 99–107）目前讀取 `link.url` / `link.label` / `link.network` 之 **raw model**；無一條讀 `link.ref`。
- 結論：**production 端 renderer 與 commerce registry 完全解耦**；commerce registry empty / non-empty 對 production HTML 0 影響。

### B.5 Dormant rails

- renderer commerce ref-resolve：**未**啟動。
- Admin picker / selector / display：**未**啟動。
- production content migration（raw → ref）：**未**啟動。
- registry seed（真實 affiliate entry）：**未**啟動。
- reverse UTM：**dormant**（per CLAUDE.md §16.4；source pm-24a/b/c landed，未 deploy）。
- pm-26 deploy gate：**BLOCKED**（per CLAUDE.md §3.2）。
- Admin Apply / middleware write / admin-write-cli：**dormant**。
- GA4 commerce dimension / click counter：**未**啟動。

---

## C. Existing Affiliate Content Shape

### C.1 目前 production frontmatter 形態（raw model only）

per `content/blogger/posts/20260504-sample-book-review.md` + `content/templates/blogger-book-review-template.md`：

```yaml
affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
  position:
    top: true
    bottom: true
  links: []          # 既有 production 全為空 array
```

或（near-term 過渡期；目前 production 無此形態，僅出現在 fixture 與設計文件）：

```yaml
affiliate:
  enabled: true
  disclosure: "..."
  position:
    top: true
    bottom: true
  links:
    - label: "博客來"        # raw label
      network: "通路王"       # raw network display
      url: "https://..."     # raw affiliate URL（target；含通路 redirect token）
```

per am-7 §4.1，未來過渡期可同 array 內混三形態：

```yaml
affiliate:
  links:
    # 形態 1：純 ref（推薦長期形態）
    - ref: "book-atomic-habits-books-com-tw"
      role: "primary"           # optional（C8 defer）
      order: 10                  # optional
      labelOverride: ""          # optional（C9 defer）

    # 形態 2：ref + raw coexist（過渡期；C6 gate；renderer 落地前 raw 仍為 fallback）
    - ref: "book-atomic-habits-kingstone"
      label: "金石堂：實體書"
      network: "聯盟網"
      url: "https://..."

    # 形態 3：純 raw（既有 production model；不強迫 migration）
    - label: "博客來"
      network: "通路王"
      url: "https://..."
```

### C.2 既有 renderer 對 raw model 之讀取

per `src/views/pages/post-detail.ejs` line 86 + line 182：

```ejs
<li><a class="lab-affiliate-box__link"
       href="<%= link.url %>"
       rel="sponsored nofollow noopener noreferrer"
       target="_blank"
       data-ga4-event="click_affiliate_cta"
       data-ga4-param-post_slug="<%= post.slug %>"
       data-ga4-param-link_label="<%= link.label %>"
       data-ga4-param-link_type="affiliate"
       data-ga4-param-link_url="<%= link.url %>"
       data-ga4-param-outbound="true"
       data-ga4-param-provider="<%= link.network || '' %>"
       data-ga4-param-placement="article_top"
   ><%= link.label %><% if (link.network) { %>
     <span class="lab-affiliate-box__network"><%= link.network %></span>
   <% } %></a></li>
```

per `src/views/blogger/blogger-post-full.ejs` lines 68–69 / 106–107（簡化版；無 GA4 attr）：

```ejs
<li><a class="lab-affiliate-box__link"
       href="<%= link.url %>"
       rel="sponsored nofollow noopener noreferrer"
       target="_blank"
   ><%= link.label %><% if (link.network) { %>
     <span class="lab-affiliate-box__network"><%= link.network %></span>
   <% } %></a></li>
```

既有 5 條 AND guard（`affiliate` 存在 / `enabled === true` / `Array.isArray(links)` / `links.length > 0` / `position.top|bottom === true`）必須在 ref-aware 階段**全部保留**；renderer 不得因 ref 而 bypass 這 5 條 guard。

### C.3 未來 ref 指向 registry key 之語意

per am-7 §4.1 + night-22 §6.1：

- `ref` 為非空 trimmed string；指向 `commerce-links.json` 之 `linkId`（machine key；e.g. `"book-atomic-habits-books-com-tw"`）。
- registry entry 包含至少：`linkId` / `internalLabel`（站長內部識別；**不**得渲染前台）/ `targetUrl`（真正導向 URL；單一管理）/ `networkKey`（指向 `affiliate-networks.json`）/ `active`（boolean）/ optional `replacementTarget` / `displayLabel` 等（per night-18 schema）。
- ref 僅為**指標**；**不**承載 affiliate dashboard credentials / token / API key / OAuth secret / 帳號 email / 結算數據 / clickCount / 使用者表單 respondent data（per am-7 §4.3 紅線）。

### C.4 raw URL 與 C6 coexistence 之關係（renderer 視角）

- 同 entry 內 `ref` 非空 + raw `url` 非空 = C6 trigger（per am-7 §5.7；source 未實作）。
- C6 在 renderer 落地前**不**啟用；renderer 落地後可由 user 評估是否啟用 C6 warning。
- renderer 必須能在 ref + raw 共存時做出明確選擇（per §E 情境 4）；不可同時 render 兩條連結（重複 CTA）。

### C.5 本文件不改 production content

- 本文件**不**改 `content/blogger/posts/20260504-sample-book-review.md` 任一字符。
- 本文件**不**改 `content/templates/blogger-book-review-template.md` 任一字符。
- 本文件**不**為設計而新增任何 raw → ref migration 範例；§C.1 形態 1/2 僅為**設計討論**，不對應任何 production 檔案。

---

## D. Proposed Renderer Input Contract

⚠️ **本節為合約設計，非實作**。renderer 落地時應參考此 contract，但**不**強制 implementation 完全照此 shape；具體變數命名 / pipeline 位置由 implementation phase 自行裁決。

### D.1 Renderer 可取得之資料來源

| 來源 | 形態 | 已存在？ | 取得方式 |
| --- | --- | --- | --- |
| `post.affiliate` | object（含 `enabled` / `disclosure` / `position` / `links[]`）| ✅ existing | post frontmatter（parse-markdown）|
| `post.affiliate.links[]` | array of entries（raw / ref / mixed）| ✅ existing | post frontmatter |
| `settings.commerceLinks` | array of registry entries（empty `[]` baseline）| ✅ existing | `load-settings.js` line 66 |
| `settings.affiliateNetworks` | array of network entries | ✅ existing（per 既有 `affiliate-networks.json` 載入）| `load-settings.js` |
| commerce link lookup map | `Map<linkId, registryEntry>` | ❌ not yet | 由 future renderer pre-build step 建構（mirror `buildCommerceLinkIdSet` 之思路；但需暴露完整 entry，非僅 id set）|
| `post.affiliate.linksResolved` 或類似衍生資料 | array of rendered link descriptors | ❌ not yet | 由 future renderer pre-build step 衍生（mirror build-github `relatedLinksRendered` / `otherLinksRendered` cadence per CLAUDE.md §16.4 GitHub→Blogger UTM 之 derive 模式）|

### D.2 Renderer pre-build step（建議）

mirror 既有 `deriveRenderedCrossLinks`（per CLAUDE.md §16.4）之 cadence，建議 future renderer 採以下 pre-build pattern：

```text
build-github / build-blogger
  └─ for each post with affiliate.links[].length > 0
       └─ deriveResolvedCommerceLinks(post.affiliate, commerceLinkMap, affiliateNetworkMap)
            ├─ resolve ref → registry entry（per linkId lookup）
            ├─ apply fallback chain（per §E.1）
            ├─ apply role / order（per §C.1 形態 1）
            └─ produce array of rendered link descriptors
       └─ pass to template as `affiliateLinksRendered`
       └─ template renders from `affiliateLinksRendered` if present；fallback `post.affiliate.links` raw
```

此設計：

- **append over rewrite**：既有 raw render path 保留；新增 ref-aware branch（template 端讀 `affiliateLinksRendered` 優先，否則 raw fallback）。
- **idempotent / pure**：pre-build step 不寫 frontmatter；不寫 registry；不發 network request。
- **fail-closed**：lookup 失敗 / registry shape invalid → 返 raw fallback 或 hidden（per §E）。

### D.3 每筆 rendered link descriptor 之最小欄位建議

⚠️ 命名為**建議**；future implementation 可調整：

| 欄位 | 型別 | 來源 | 必填 |
| --- | --- | --- | --- |
| `ref` | string \| null | post entry `ref`（若有）| no |
| `label` | string | display label（per §E.1 fallback chain）| ✅ yes |
| `url` | string | resolved target URL（per §E.1 fallback chain）| ✅ yes（若 entry 應顯示）|
| `network` | string \| null | network display（per registry entry / raw entry）| no |
| `rel` | string | 強制 `"sponsored nofollow noopener noreferrer"`（per §F）| ✅ yes |
| `target` | string | 強制 `"_blank"`（per §F）| ✅ yes |
| `role` | string \| null | per-instance 顯示角色（C8 defer 之 enum；本文件不裁決 enum 渲染對應）| no |
| `order` | number \| null | sort hint | no |
| `placement` | string | `"article_top"` 或 `"article_bottom"`（既有 GA4 attr 既有 cadence）| ✅ yes |
| `provider` | string | GA4 attr `data-ga4-param-provider` 之 value（per registry `networkKey` 或 raw `network`）| no |
| `visibility` | string enum | `"render"` / `"hidden"` / `"placeholder"`（per §E）| ✅ yes |
| `fallbackReason` | string enum \| null | `null` / `"raw-only"` / `"ref-resolved"` / `"ref-not-found"` / `"ref-inactive"` / `"ref-coexist"` / `"missing-url"`（debug / future C6 / 未來 GA4 dimension 用；render 端**不**直接渲染至 HTML）| no |

🔑 **紅線**：tracking / metadata 不應暴露於 HTML attribute 或前台可見元素（除非未來另有治理設計）：

- registry `internalLabel` **永不**渲染至 HTML（per am-7 §4.4）。
- registry 內任何 token / OAuth secret / clickCount / commission **永不**進 descriptor，更不進 HTML（per am-7 §4.3 紅線；CLAUDE.md §3.2 commerce 治理紅線）。
- `fallbackReason` 為 debug-only；renderer 可選擇將其放入 `data-ga4-param-fallback-reason` 之類 GA4 attr（屬未來 GA4 commerce dimension phase，不在本檔範圍）；template 端**不**直接渲染至前台可見文字。

### D.4 Renderer 不應做的事

- ❌ **不**寫 frontmatter / registry / settings JSON / Admin static files。
- ❌ **不**呼叫 affiliate dashboard API / Google Sheets API / 任何 outbound HTTP（renderer 為 pure / offline）。
- ❌ **不**自動 migrate raw → ref；migration 永遠須作者逐篇明示。
- ❌ **不**做 reachability check（mirror download D4 non-rule per `docs/20260530-download-fileurl-preview-url-risk-policy.md`；renderer 永不 fetch URL）。
- ❌ **不**自動啟動 reverse UTM / pm-26 / Admin Apply / GA4 commerce dimension。

---

## E. Fallback Behavior Contract

⚠️ **本節為情境設計，非實作**。renderer 落地時 future phase 須裁決各情境之最終行為；本檔列出選項 + 推薦。

### E.1 Display label fallback chain（共通）

無論 ref 是否命中，display label 均採如下優先序（trim 後非空才取）：

```
post entry labelOverride（per-instance；C9 defer 之欄位）
  → post entry label（raw；過渡期保留）
    → registry displayLabel（registry entry；若 ref 命中且 entry 有此欄位）
      → registry merchantName（fallback；若 entry 有此欄位）
        → 「查看商品」（hardcoded safe fallback；建議；renderer 落地時可調整字串）
```

🔑 **internalLabel 紅線**：registry `internalLabel` **永不**進 fallback chain（per am-7 §4.4 紅線）。

🔑 **不允許空白 CTA**：若 chain 走到底仍為空字串，最終必有 hardcoded safe fallback 字串（建議 `「查看商品」`；renderer 落地時 user 可改 `「立即購買」` / `「前往通路」` / 等）。**永不**輸出 `<a>...</a>` 之空白文字 CTA。

### E.2 情境 1：ref valid 且 registry entry active

| 子情境 | 推薦行為 |
| --- | --- |
| ref 命中；entry `active !== false`；entry `targetUrl` 為合法 `^https?://` | render link；href = entry `targetUrl`；label 走 §E.1 chain；rel / target 強制 per §F；`fallbackReason = "ref-resolved"`；`visibility = "render"` |
| 同上但 entry `targetUrl` 為空 / invalid | fail closed：`visibility = "hidden"`；不 render；`fallbackReason = "missing-url"`（registry-level 應由 R6 / R7 warning 涵蓋；renderer 不負責顯示警告） |

**理由**：ref-resolved 為長期目標路徑；entry `targetUrl` 為 single source of truth；renderer **不**讓 post entry `url` 覆寫 registry `targetUrl`（per am-7 §4.4 紅線：作者可覆寫 display text，不可覆寫 target URL）。

### E.3 情境 2：ref 非空但 registry not-found

| 選項 | 描述 | 推薦？ |
| --- | --- | --- |
| 選項 2A | render link 用 post entry raw `url`（若有）；`fallbackReason = "ref-not-found"`；visibility = `"render"` | ⚠️ 過渡期可考慮（若 raw + ref coexist 形態 2）；但與 §E.5 衝突（雙來源） |
| 選項 2B | **fail closed：不 render；visibility = `"hidden"`；`fallbackReason = "ref-not-found"`** | ✅ **推薦** |
| 選項 2C | render placeholder（「連結暫時無法顯示」）；visibility = `"placeholder"` | ❌ 不推薦：前台噪音；對使用者無價值 |

**推薦選項 2B（fail closed / hidden）**，理由：

- validator 已透過 `commerce-ref-not-found`（C3）warning-only 提示作者修正；renderer 不重複呈現警告。
- 不顯示 broken 連結比顯示「點了無效」之連結更安全。
- 與 C6 coexistence 之設計對齊：若同 entry 既有 ref 又有 raw url，§E.5 之選項 5C（ref 優先 fail closed → fall back raw）可由作者明示決定；若**只有 ref 無 raw url**，fail closed 為唯一安全選項。
- 對 SEO / 使用者體驗友善：搜尋引擎不抓到 broken affiliate URL；使用者不看到斷鏈 CTA。

### E.4 情境 3：registry entry inactive（C4；目前 source 未啟動）

| 選項 | 描述 | 推薦？ |
| --- | --- | --- |
| 選項 3A | render link 用 `replacementTarget` 之 entry `targetUrl`（若有）；fallback to inactive entry `targetUrl` | ⚠️ 需要 C4 source + registry seed；本文件不裁決 |
| 選項 3B | **fail closed：不 render；visibility = `"hidden"`；`fallbackReason = "ref-inactive"`** | ✅ **推薦（near-term；C4 source 落地前）** |
| 選項 3C | render disabled state（灰色 / 「商品已下架」）；visibility = `"placeholder"` | ⚠️ 需要 UX 設計；本文件不裁決 |

**推薦選項 3B（fail closed / hidden）為 near-term default**，理由：

- C4 source 未啟動；inactive 概念尚未在 validator 端 enforce。
- replacementTarget 機制需要 R12 source + registry seed；現階段不存在實際 entry 可測。
- fail closed 與情境 2 一致；renderer 邏輯較簡單（命中 + active === false → 等同 not-found）。
- 待 C4 source 落地後，renderer 可由 future phase 升級至 3A（自動 follow replacementTarget）或 3C（顯示 disabled state）。

### E.5 情境 4：ref 與 raw `url` 同時存在（C6 coexistence）

🔑 **核心衝突情境**：同 entry `ref` 非空 + raw `url` 非空。

| 選項 | 描述 | 推薦？ |
| --- | --- | --- |
| 選項 5A | raw `url` 優先；忽略 ref；`fallbackReason = "raw-priority"` | ❌ 不推薦：違反「ref 為長期 single source of truth」原則；migration 失去意義 |
| 選項 5B | **ref 優先；若 ref 命中 → 用 registry `targetUrl`；若 ref not-found / inactive → fall back raw `url`；`fallbackReason = "ref-coexist"`（命中）/ `"ref-fallback-raw"`（未命中）** | ✅ **推薦** |
| 選項 5C | ref 命中 → ref；ref 未命中 → fail closed（不 fallback raw）；`fallbackReason = "ref-coexist"` 或 `"ref-not-found"` | ⚠️ 過渡期太嚴；可能導致 production 連結消失 |
| 選項 5D | render 兩條連結（ref 與 raw 各一）| ❌ 不推薦：重複 CTA；違反使用者體驗 |

**推薦選項 5B（ref 優先；命中用 registry，未命中 fall back raw）**，理由：

- 過渡期作者 frontmatter 可保留 raw `url` 作為 safety net；若 ref 命中 registry，自動採用集中管理之 `targetUrl`；若 ref 暫時還沒登錄 registry，前台不破。
- 與 C6 coexistence warning 設計對齊：validator 透過 C6 warning 提示作者「raw url 可移除」；renderer 不阻擋 build；作者逐篇 migration。
- 與 §C.3 形態 2 過渡期共存模式一致：作者建 ref，registry 未就緒前 raw 仍生效；registry 就緒後自動切 ref。
- 避免「ref 登錄錯誤 → production 連結消失」之災難場景（option 5C 之風險）。

🔑 **未來 C6 啟動時 renderer 行為應保持不變**：C6 為 validator 層 warning；renderer 仍採選項 5B；C6 提示作者「請移除 raw url 完成 migration」，但不強迫 renderer 改變行為。

### E.6 情境 5：missing display text（label 全部為空）

per §E.1：renderer 永不輸出空白文字 CTA。

| 子情境 | 推薦行為 |
| --- | --- |
| post entry `labelOverride` / `label` 皆空；registry `displayLabel` / `merchantName` 皆空 | 採 hardcoded safe fallback（建議 `「查看商品」`）；不 fail；不 hide |
| post entry 純 raw + raw `label` 空 + raw `url` 有值 | 採 hardcoded safe fallback；mirror 既有 raw model 之容錯（template 端目前 `<%= link.label %>` 為空時會輸出空 `<a></a>`；renderer 落地時可一併 fix） |

🔑 **本文件不裁決最終 fallback 字串**；implementation phase 由 user 裁決中 / 英文 / 通用 / 通路特定（如博客來顯示「博客來」）。但要求：

- 一律 trimmed 後非空。
- 不包含 HTML 標籤（避免 XSS）。
- 不包含內部 internal label（per E.1 紅線）。

### E.7 Cascade summary table

| 情境 | ref | 命中 | active | raw url | visibility | href 來源 | label 來源 | fallbackReason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ✅ | ✅ | true | any | render | registry `targetUrl` | §E.1 chain | `ref-resolved` |
| 1b | ✅ | ✅ | true | any | hidden | — | — | `missing-url`（registry entry targetUrl 缺/invalid）|
| 2 | ✅ | ❌ | — | ❌ none | **hidden** | — | — | `ref-not-found` |
| 3 | ✅ | ✅ | false | — | **hidden（near-term）** | — | — | `ref-inactive` |
| 4 ref+raw 命中 | ✅ | ✅ | true | ✅ has | render | registry `targetUrl`（5B）| §E.1 | `ref-coexist` |
| 4 ref+raw 未命中 | ✅ | ❌ | — | ✅ has | render | raw `url`（5B fallback）| §E.1 | `ref-fallback-raw` |
| 5 純 raw | ❌（無 ref）| — | — | ✅ has | render | raw `url` | raw `label` → fallback | `raw-only` |
| 6 純 raw 無 url | ❌ | — | — | ❌ none | **hidden** | — | — | `missing-url` |

🔑 **既有 5 條 AND guard 不變**：所有情境前提為 `affiliate.enabled === true` + `Array.isArray(links)` + `links.length > 0` + `position.top|bottom === true`；任一不通過 → 整個 box 不 render，與 ref / raw 無關。

---

## F. Renderer Output Contract

### F.1 HTML 結構建議（沿用既有 BEM）

per CLAUDE.md §9 + 既有 `lab-affiliate-box` BEM（per `src/styles/components/_affiliate-box.scss`），future renderer 應**沿用既有 class**：

```html
<aside class="lab-affiliate-box">
  <h3 class="lab-affiliate-box__title">立即購買</h3>
  <p class="lab-affiliate-box__disclosure">本文包含聯盟行銷連結。...</p>
  <ul class="lab-affiliate-box__links">
    <li>
      <a class="lab-affiliate-box__link"
         href="..."
         rel="sponsored nofollow noopener noreferrer"
         target="_blank"
         data-ga4-event="click_affiliate_cta"
         data-ga4-param-...
      >
        Label
        <span class="lab-affiliate-box__network">通路名</span>
      </a>
    </li>
  </ul>
</aside>
```

**不**新增 class（除非 implementation phase 經評估）：

- ❌ 不新增 `lab-affiliate-box__link--resolved` / `lab-affiliate-box__link--fallback` / 之類 modifier（避免前台暴露 fallback 狀態）。
- ❌ 不新增 `lab-commerce-link` / `lab-commerce-link-list`（避免命名衝突；既有 `lab-affiliate-box` 已涵蓋）。
- ⚠️ 若 future role-based UX 需求出現（C8 enum 落地後），可考慮 `lab-affiliate-box__link--primary` / `--alternate` 之 modifier；本文件不裁決。

### F.2 rel / target / aria-label 強制行為

| attr | value | 來源 | 可覆寫？ |
| --- | --- | --- | --- |
| `rel` | `"sponsored nofollow noopener noreferrer"` | hardcoded（per CLAUDE.md §16.2 + 既有 template）| ❌ 不可（無論 ref / raw / resolved）|
| `target` | `"_blank"` | hardcoded | ❌ 不可 |
| `aria-label` | optional；建議 `"前往 {network} 購買 {label}"` 或保留 label as text content | renderer 可選擇；無 author override | ⚠️ implementation 裁決 |
| `download` attr | ❌ **永不**加（download 為教具 BEM，affiliate 為購買 BEM；兩者不混用）| — | — |

🔑 **rel / target 紅線**：renderer **永不**讓 post frontmatter / registry entry 覆寫 `rel` 或 `target`。即使 registry 含 `relOverride` / `targetOverride` 欄位（本文件不建議新增），renderer 端也應忽略並 sticky 強制值。理由：

- 聯盟連結之 SEO 與 link-equity 行為由 CLAUDE.md §16.2 明確規定（`sponsored nofollow noopener noreferrer`）；任何覆寫破壞此契約。
- `target="_blank"` 保護來源頁不被 affiliate 拖走 referrer / opener。

### F.3 Class naming 建議

| 用途 | 建議 class | 理由 |
| --- | --- | --- |
| 整體 box | `lab-affiliate-box` | ✅ 既有 |
| 標題 | `lab-affiliate-box__title` | ✅ 既有 |
| disclosure | `lab-affiliate-box__disclosure` | ✅ 既有 |
| 連結 list | `lab-affiliate-box__links` | ✅ 既有 |
| 連結 | `lab-affiliate-box__link` | ✅ 既有 |
| network 顯示 | `lab-affiliate-box__network` | ✅ 既有 |
| role modifier（未來；C8 後）| `lab-affiliate-box__link--<role>` | ⚠️ defer to C8 source landing |
| commerce ref-resolved 視覺差異 | ❌ **不**新增 | 避免前台暴露 fallback 狀態 |

### F.4 不承諾啟用之功能

⚠️ **本文件不承諾以下功能於 renderer 落地時自動啟用**：

- ❌ **GA4 commerce dimension**：既有 `data-ga4-event="click_affiliate_cta"` + provider / placement attr 維持既有 cadence；不新增 `data-ga4-param-ref` / `data-ga4-param-fallback-reason` / `data-ga4-param-network-key` 等；新增 GA4 dimension 屬獨立 phase，需 user 明確授權 + GA4 Realtime 驗收（mirror reverse UTM pm-26 gate）。
- ❌ **click counter**：renderer 不寫入 click count 至 registry / Admin / repo；mirror download R1 紅線（respondent data / 統計數據永不進 repo）。
- ❌ **reverse UTM 自動套用 affiliate URL**：reverse UTM dormancy 持續；renderer 不自動為 affiliate URL 注入 cross-site UTM（CLAUDE.md §16.4 之 GitHub→Blogger / Blogger→GitHub 自動 UTM 為 cross-site **internal** link 之機制，affiliate URL 為 **external** link，本來就**不**在 reverse UTM 範圍）。
- ❌ **A/B test / 隨機通路選擇 / 多通路輪播**：不在 v1 範圍；renderer 採固定順序（per `order` 欄位 hint，未來 implementation 可實作）。
- ❌ **autocomplete / typeahead suggestion**：屬 Admin picker phase；renderer 不負責。
- ❌ **registry hot reload**：renderer 為 build-time pure；不支援運行時 reload；registry 變動需 rebuild。

### F.5 不在 frontmatter / fixture 放真實 affiliate URL（紅線）

🔑 **本文件 + 未來 renderer 落地 + Admin picker / migration 全程紅線**（mirror CLAUDE.md §3.2 commerce 治理紅線）：

- ❌ frontmatter（post / template / fixture）**永不**包含真實博客來 / 蝦皮 / momo / 聯盟網 / 通路王 affiliate URL with token / 通路特定 tracking parameter。
- ❌ fixture 之 ref 命名必須採 fixture 命名空間（如 `__nonexistent-*` / `fixture-ref-*`；per night-2 §5.6）。
- ❌ docs 內**不**貼真實 affiliate URL（本檔已 enforced；§C.1 形態 2 / 3 範例之 `https://...` 為佔位字串，非真實 URL）。
- ❌ commerce-links registry 若未來 seed real entry，須**另開獨立 seed phase + user 明確授權**（per §I）。

---

## G. Validation and C6 Relationship

### G.1 既有 commerce content-ref validator（已 landed）

- ✅ C1 `commerce-ref-invalid-type`：warning-only；source landed；fixture landed。
- ✅ C2 `commerce-ref-empty`：warning-only；source landed；fixture landed。
- ✅ C3 `commerce-ref-not-found`：warning-only；source landed；fixture landed。
- ✅ C5 `commerce-ref-duplicate-in-post`：warning-only；source landed；fixture landed。

### G.2 本檔與 C6 之關係

- C6 `commerce-ref-local-url-coexistence-warning`（per am-7 §5.7）：
  - **gated by renderer landed + migration phase**（per am-7 §5.7 啟動條件 (1)）。
  - 本檔提供 renderer fallback contract 之 **(1) 之前置設計**；但**不**自動滿足 (1)（renderer 仍未落地）。
  - 本檔**不**啟動 C6 source；**不**新增 C6 fixture；**不**改 C6 trigger 邏輯。
- 本檔可作為 C6 解封之**前置條件之一**（per am-7 §5.7 (1)）；但**不**自動解封 C6。
- C6 之啟動仍需：
  - (1) renderer fallback phase 完成（ref lookup live）—— 本檔僅為 contract，未 landed。
  - (2) user explicit approval 啟動 migration phase。
  - (3) C6 fixture 先建（fixture-first）。
  - (4) 啟用後仍 warning-only。
  → 四條件中本檔可 partial 貢獻 (1) 之**設計**；其餘三條件全未滿足。

### G.3 本檔不影響 C4 / C8 / C9

- C4 `commerce-ref-inactive`：需要 registry 有 `active: false` entry → coupling Option A；本檔**不**解封 C4 source；**不**新增 C4 fixture；**不**裁決 inactive renderer 行為之最終形態（§E.4 為 near-term 推薦，C4 source 落地時可由 future phase 升級）。
- C8 `commerce-ref-invalid-role`：需要 role enum 凍結 + source land；本檔列出建議 enum（per am-7 §4.5）但**不**裁決；**不**新增 C8 source / fixture。
- C9 `commerce-ref-display-override-risk`：需要 registry entry + labelOverride 邏輯；本檔提及 §D.3 之 `internalLabel` 紅線（renderer 端 enforce），但**不**新增 C9 source / fixture。

### G.4 validator 與 renderer 之邊界

| 維度 | validator 職責 | renderer 職責 |
| --- | --- | --- |
| 提示作者 ref 寫錯 | ✅ warning（C1 / C2 / C3 / C5；未來 C4 / C6 / C8 / C9）| ❌ 不負責；不在 HTML 中顯示警告 |
| 提示 reviewer 是否該 migrate | ✅ warning（未來 C6）| ❌ 不負責 |
| 決定使用者看到 / 不看到連結 | ❌ 不負責（warning-only；不 block build）| ✅ 負責（per §E fallback chain）|
| 決定 href / rel / target / label 內容 | ❌ 不負責 | ✅ 負責（per §E + §F）|
| 寫入 frontmatter / registry | ❌ read-only | ❌ read-only |

🔑 **renderer 不假設 validator 已 pass**：renderer 必須在 warning 存在時仍能生成 HTML（mirror download renderer preanalysis §8.4）；validator 為 warning-only，永不 block build；renderer 必須對 invalid / missing / coexist 之 ref 做 fail-closed / graceful fallback。

### G.5 fixture 與 renderer 之關係

- 既有 4 個 commerce content-ref fixture（C1 / C2 / C3 / C5）為 validator 層 fixture；**不**驗證 renderer 行為。
- 未來 renderer 落地時，可能需要 **renderer-specific fixture**（per future implementation phase）：
  - fail-closed 場景 fixture（情境 2 / 3）。
  - ref + raw coexist fallback fixture（情境 4）。
  - empty label fallback fixture（情境 5）。
- 但本檔**不**設計、**不**建立 renderer fixture；屬未來 implementation phase 範圍。
- renderer fixture 若新增，須對齊 4 條件：(1) `content/validation-fixtures/` 命名空間；(2) 不污染 production posts；(3) 不污染 `build:github` / `build:blogger` 之 dist；(4) 不放真實 affiliate URL（per §F.5 紅線）。

---

## H. Admin Picker Relationship

### H.1 Admin picker 不在本 phase

- ❌ Admin picker / selector / display 尚未啟動。
- ❌ 本檔**不**啟動 Admin picker；**不**裁決 Admin UI / picker UX。
- ❌ 本檔**不**啟動 Admin Apply / middleware write route / admin-write-cli（per CLAUDE.md §3.2 commerce 治理紅線 + §27 修改紅線）。

### H.2 Renderer contract 可幫助未來 Admin picker

renderer contract（per §D / §E / §F）可間接提供 Admin picker 之 **input contract**：

| Admin picker UI 需要 | 來源 |
| --- | --- |
| 顯示 registry entry 之內部識別 | registry `internalLabel`（picker 可顯示；前台不顯示）|
| 顯示 registry entry 之顯示文字 | registry `displayLabel`（picker 預覽 + 前台顯示）|
| 顯示 registry entry 之 active 狀態 | registry `active`（picker 過濾 / 警告 inactive entry）|
| 顯示 registry entry 之通路 | registry `networkKey`（join `affiliate-networks`）|
| 寫入文章 frontmatter 之欄位 | `affiliate.links[i].ref`（per §C.1 形態 1）|
| 寫入文章 frontmatter 之 role | `affiliate.links[i].role`（per §C.1 形態 1；C8 enum）|
| 文章端覆寫顯示文字 | `affiliate.links[i].labelOverride`（per am-7 §4.4；C9 風險 trigger）|

🔑 **Admin picker 紅線**（mirror am-7 §7.1 + CLAUDE.md §3.2）：

- ❌ Admin picker **永不**讀 affiliate dashboard credentials / token / API key / OAuth secret。
- ❌ Admin picker **永不**寫 respondent data 到 repo。
- ❌ Admin picker **永不**覆寫 registry `targetUrl`（target URL 由站長手動編輯 commerce-links.json；picker 只挑 linkId）。
- ❌ Admin picker **永不**自動啟動 reverse UTM / pm-26 unblock / Admin Apply。

### H.3 Admin picker 之前置條件（per am-7 §7.1 + 本檔擴充）

- [ ] renderer fallback contract 已凍結（本檔；landed 後）。
- [ ] renderer implementation 至少 single-post landing（commerce ref-resolve render path live）。
- [ ] commerce-links registry seed policy 凍結（per §I）。
- [ ] CLAUDE.md §3.2 commerce 治理紅線已同步至 Admin picker 設計（picker UI 不誘導作者貼 token / dashboard credential）。

任一 unmet → Admin picker phase **不**啟動。本檔僅滿足 **(1) 之 contract 凍結**；其餘三條件未滿足。

---

## I. Registry Seed Relationship

### I.1 本文件不 seed registry

- ❌ 本檔**不**改 `content/settings/commerce-links.json`（empty `[]` 維持）。
- ❌ 本檔**不**加入任何真實 affiliate entry / merchant token / tracking id / OAuth secret / 帳號 email / 私人 Drive folder ID。
- ❌ 本檔**不**加入任何示範 entry（如 `linkId: "demo-book"` 之類）；mirror download empty registry R1-clean cadence。
- ❌ 本檔**不**為 fixture 修改 production `affiliate-networks.json`（per CLAUDE.md §3.2 R11 fixture 紅線）。

### I.2 未來 registry seed 需獨立授權

未來若要 seed 第一批 production registry entry，須由獨立 phase（mirror Candidate D per am-7 §9.4）規劃：

| 前置條件 | 是否 require |
| --- | --- |
| renderer fallback contract（本檔） | ✅ landed |
| renderer implementation（C1..C5 ref-resolve render path） | ✅ landed |
| C6 coexistence warning preanalysis | ✅ landed |
| Admin picker 設計（or 替代方案：手動編輯 commerce-links.json）| ✅ landed |
| seed policy（fake fixture registry vs real production registry 之治理邊界）| ✅ landed |
| user explicit approval（reverse UTM unblock / pm-26 unblock / Admin Apply 之啟動需個別評估）| ✅ required |
| CLAUDE.md §3.2 commerce 治理紅線確認（無 token / 無 dashboard credential / 無 respondent data） | ✅ required |

### I.3 fake fixture registry vs real production registry 之治理邊界

⚠️ **本檔不裁決；列出選項供未來 phase 評估**。

| 選項 | 描述 | 取捨 |
| --- | --- | --- |
| 選項 I-A | production `commerce-links.json` 維持 empty；fixture 用 `__nonexistent-*` ref；renderer / Admin / validator 全在 empty registry 下測試 | ✅ 紅線最乾淨；無真實 affiliate URL；但 renderer 之 ref-resolve happy path 無 fixture coverage |
| 選項 I-B | 新增 `content/validation-fixtures/settings/commerce-links/_test-<purpose>.json` 之 settings-level fixture（per am-2 §10 Option A escape hatch）；production registry 維持 empty | ⚠️ 須擴 loader 暴露 raw registry + 新 fixture-mode code path + sourcePath 改寫；違反 am-2 Option D 凍結；屬獨立 phase 啟動 |
| 選項 I-C | production `commerce-links.json` seed 一筆 real affiliate entry；fixture 與 production 共用 | ❌ 違反 R1-clean；fixture 與 production 強耦合；renderer / Admin 之測試會污染 production registry |

→ 本檔**不**裁決；屬未來 registry seed policy phase。

🔑 **本檔僅承諾**：renderer 在 empty registry 下必須能正確 graceful fallback（per §E）；renderer 行為不依賴 registry 有任何 entry。

---

## J. Recommended Future Phase Order

⚠️ **本 phase 不自動啟動下一階段**；以下為**候選**順序，由 user 各自獨立 prompt 決定。

### J.1 候選順序

```
1. Final Idle Freeze / EXIT（本 phase 結束後預設）
2. renderer fallback contract acceptance read-only（docs-only）
3. C6 coexistence warning preanalysis（docs-only；本檔已部分前置）
4. C4 / C8 / C9 data model / enum preanalysis（docs-only）
5. Admin picker contract preanalysis（docs-only）
6. registry seed policy preanalysis（docs-only；含選項 I-A / I-B / I-C 裁決）
7. renderer source implementation（source；需 user 明確授權）
8. renderer fixture phase（fixture；需 source landed）
9. C6 source implementation（source；需 renderer landed + user 授權）
10. controlled production migration（content；需 renderer + C6 source landed + user 授權）
11. registry seed（settings；需 seed policy landed + user 授權）
12. Admin picker implementation（source；需所有前置 landed）
13. build / deploy / Blogger repost / GA4 validation（只有 user 明確授權）
```

### J.2 各 step 之啟動規則

- 每個 step 必須由 **user 明確 prompt** 啟動，不自動推進。
- 前置 step 必須 landed 並通過 read-only acceptance。
- 紅線（per §K）必須逐項確認未動。
- 任何 step 之 baseline movement 預估必須事先 docs 化。
- 任何 step 必須 mirror R-series cadence：`docs-only preanalysis → read-only acceptance → source/fixture implementation → read-only checkpoint`。

### J.3 對應 reverse UTM / pm-26 / Admin Apply 之關係

- ❌ 本文件**不**自動解除 reverse UTM dormancy。
- ❌ 本文件**不**自動解封 pm-26 deploy gate。
- ❌ 本文件**不**自動啟動 Admin Apply / middleware / admin-write-cli。
- 上述三項之啟動須各自獨立 phase + user 明確授權；與本檔之 contract 無自動 coupling。

---

## K. Non-goals / Red Lines

### K.1 本 phase 紅線（必須 enforced）

明確列出本文件**不**處理：

- ❌ **renderer source implementation**（任一 EJS template 變動 / 任一 build script 變動）
- ❌ **template changes**（`src/views/pages/post-detail.ejs` / `src/views/blogger/blogger-post-full.ejs` / 任一 `.ejs` 不動）
- ❌ **Blogger renderer changes**（`build-blogger.js` / `blogger-post-summary.ejs` / `blogger-redirect-card.ejs` 不動）
- ❌ **registry seed**（`content/settings/commerce-links.json` 維持 empty `[]`）
- ❌ **real affiliate URL**（docs / fixtures / templates / production content 任一檔案內**不**貼）
- ❌ **merchant token / tracking id / OAuth secret / API key / Authorization header / 帳號 email / 結算密碼 / 私人 Drive folder ID**（任一檔案內**不**出現）
- ❌ **production content migration**（既有 `affiliate.links` 不動；既有 production posts 之 `affiliate.links: []` 維持空）
- ❌ **Admin picker / Admin Apply**（dormant 維持）
- ❌ **middleware route**（dormant 維持）
- ❌ **admin-write-cli**（dry-run / apply 皆 dormant）
- ❌ **C4 / C6 / C7 / C8 / C9 source**（不啟動 / 不新增 rule）
- ❌ **new fixtures**（不新增任何 `.md` / `.json` fixture；既有 fixture 不修改 / 不刪除）
- ❌ **build / deploy**（`npm run build*` / `dev` / `preview` 不執行；`dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` 不碰）
- ❌ **Blogger repost**（Blogger 後台不重貼；無觸發 GA4 Realtime 驗收）
- ❌ **GA4 validation**（DebugView / Realtime / commerce dimension 全 dormant）
- ❌ **reverse UTM activation**（reverse UTM 維持 dormant；Blogger→GitHub source landed but un-deployed 狀態維持）
- ❌ **pm-26 unblock**（pm-26 deploy gate 維持 BLOCKED）
- ❌ **CLAUDE.md 修改**（若需 sync renderer 狀態 → 另開 docs-sync phase）
- ❌ **package change**（`package.json` / `package-lock.json` / `vite.config.js` 不動）
- ❌ **`npm install`**（不執行）
- ❌ **MEMORY / project memory 修改**（除非 user 另行要求）
- ❌ **自動啟動下一階段**

### K.2 governance 紅線（與 CLAUDE.md §3.2 commerce 治理紅線一致）

- ❌ **永不**含 affiliate dashboard credentials（email / password / OAuth client secret / API key）
- ❌ **永不**含 access token / bearer token / refresh token / session id / Authorization header
- ❌ **永不**含 commission / payout / clickCount 等 dashboard 統計
- ❌ **永不**含帳號 email / 結算密碼 / 私人 Drive folder ID
- ❌ **不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`；所有 key 由作者明示填寫
- ❌ **禁止**為 fixture 修改 production `affiliate-networks.json`；R11 fixture 須採「故意不存在 networkKey」設計
- reverse UTM remains **dormant**；pm-26 deploy gate remains **BLOCKED**
- Admin Apply / middleware write / admin-write-cli remain **dormant**

### K.3 renderer 永久紅線（適用於未來 implementation phase）

未來 renderer 落地時必須**永久 enforce**：

- ❌ **rel / target 不可被 frontmatter / registry 覆寫**（per §F.2）
- ❌ **registry `internalLabel` 不渲染至前台**（per §E.1 + am-7 §4.4）
- ❌ **registry `targetUrl` 不被 frontmatter 覆寫**（per am-7 §4.4 + §E）
- ❌ **registry token / commission / OAuth secret 不暴露於 HTML / GA4 attr / debug log**（per §D.3）
- ❌ **renderer 永不發 outbound HTTP / reachability check**（per §D.4 + download D4 non-rule）
- ❌ **renderer 永不寫 frontmatter / registry / settings**（per §D.4；renderer pure / read-only）
- ❌ **renderer 永不自動 migrate raw → ref**（per §D.4；migration 永遠須作者明示）
- ❌ **renderer 永不自動啟動 reverse UTM / pm-26 / Admin Apply / GA4 commerce dimension**（per §J.3 + §F.4）

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 欄位 + linkId 命名 + ref 候選 (a)/(b)/(c)/(d)）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；R1-clean 7 條件）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；R1..R15 / C1..C9 rule contract；§6 content-reference 思路源）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；fixture mechanism Option D；Option A path naming convention）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（am-7；C1..C9 content-reference rule + ref data model + Admin / renderer 影響範圍標記）
- `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`（night-2；C1/C2/C3/C5 fixture 設計凍結；本檔 contract 之 fixture-side 參考）
- `docs/20260603-download-landing-page-renderer-preanalysis.md`（download landing page renderer preanalysis；本檔大量借鑑其 Renderer Responsibility Boundary / Registry Resolution / Red Lines cadence）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + download R-series cadence + 紅線）/ §9（CSS class 命名 + Flexbox 優先）/ §12（書評 affiliate.links schema）/ §16.1 / §16.2 / §16.4（連結處理 + reverse UTM dormancy）/ §22（圖片素材）/ §27（修改紅線）/ §29（第一版不做清單）/ §30（最終樣貌）
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/affiliate-networks.json`（既有 network registry；R11 referential target；本 phase 不動）
- `src/scripts/load-settings.js` lines 59–66（commerce loader；本 phase 不動）
- `src/scripts/validate-content.js` lines 379–445 / 567–655 / 729 / 1405（commerce registry + content-reference validator；本 phase 不動）
- `src/views/pages/post-detail.ejs` lines 69–91 / 168–186（既有 raw affiliate render；本 phase 不動；本檔 §C.2 引用）
- `src/views/blogger/blogger-post-full.ejs` lines 60–69 / 98–107（既有 Blogger raw affiliate render；本 phase 不動；本檔 §C.2 引用）
- `src/styles/components/_affiliate-box.scss`（既有 BEM；本 phase 不動；本檔 §F.1 / §F.3 引用）
- 4 個已落地 commerce content-ref fixtures（本 phase 不動）：
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-invalid-type.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-empty.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-duplicate.md`
- `content/templates/blogger-book-review-template.md`（`affiliate.links: []` 範本；本 phase 不動）
- `content/blogger/posts/20260504-sample-book-review.md`（production `affiliate.links: []`；無 ref 使用；本 phase 不動）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`1b25b54068b0e8f8a21a309cdd465f3cdc565729`
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(claude): sync commerce content ref fixtures state`
- `npm run validate:content`（pre-commit）→ **0 errors / 66 warnings / 57 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 errors / 66 warnings / 57 posts**

---

（本文件結束）
