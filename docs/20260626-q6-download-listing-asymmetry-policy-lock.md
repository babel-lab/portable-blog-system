# Q6 download / listing asymmetry — policy lock（docs-only）

- Phase id：`20260626-q6-download-listing-asymmetry-policy-lock`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only policy lock**（純文件決策鎖；**不**改 content、**不**改 source、**不**改 validator、**不**改 validation baseline、**不**改 CLAUDE.md、**不** build、**不** deploy、**不**碰 live service）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 B / C / D / E / F / G / H / I / J / K / L / M / N 任何 source。
- 授權：Dean explicit approval（Q6 Option B；本 phase scope 限定 docs-only policy lock，唯一新增本檔）
- 承接：`docs/20260626-blog-next-phase-decision-footer-and-funnel-preflight.md` §10（Q6 決策項）+ 本 session read-only preflight 結論。

---

## 1. Baseline

進場 baseline（read-only；新增本檔前）：

| 項目 | 狀態 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `1b7ff25` |
| subject | `docs(policy): lock root legacy index handling` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

baseline 符合預期；本 phase 唯一允許之變更＝新增 `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`。

---

## 2. Purpose

本文件目的：把 Q6 **download / listing asymmetry** 的現況、原因、風險判斷、deferred 決策與未來重啟條件，收斂為單一可引用之 policy lock。

明確界線（本 phase 一律不做）：

- **不改 content**（尤其不碰 `content/github/posts/20260504-portable-blog-system-mvp.md`）。
- **不改 source**（不碰 `include-in-listings.js` / `include-in-sitemap.js` / `page-type-robots.js` / `build-github.js` / `build-sitemap.js` / post-detail renderer）。
- **不改 validator**。
- **不改 validation baseline**（不 sync 數值）。
- **不改 CLAUDE.md / MEMORY.md**。
- 本文件**不代表 live site 有阻斷問題**；Q6 為 deferred housekeeping / content-strategy hold，非 blocker。

---

## 3. Current Q6 state（read-only preflight 結論）

GitHub listing / sitemap / robots 為**三條正交設計**，互不推導：

- **`includeInListings`** 控制站內 listing（home / post-list / category / tag / prev-next）。
  - 實作：`src/scripts/include-in-listings.js`（`shouldIncludeInListings`）。
  - Slice 2：`contentKind==='download'` 或 `pageType∈{download,gated_download}` 且未顯式 `includeInListings:true` → 預設排除；顯式 `true` 可 opt-in 留下；top-level `false` / `platformPolicy.github.includeInListings:false` 永遠排除。
- **`includeInSitemap` / sitemap safety** 控制 sitemap 注入。
  - 實作：`src/scripts/include-in-sitemap.js`（`isSitemapEligible` / `shouldIncludeInSitemap`）。
  - safety 永遠最高優先：`noindex-*` 或 legacy `contentKind:download` → 永遠排除，任何 override 不得放行。
- **`page-type-robots`** 控制 robots / indexing。
  - 實作：`src/scripts/page-type-robots.js`（`derivePageTypeRobots` / `resolvePostDetailRobots`）。
  - explicit `seo.indexing` 最高優先；`pageType∈{download,gated_download}` → `noindex, follow`；`platformPolicy.github.indexing` 僅能 tighten。
- **post-detail 全量生成**：`build-github.js` 對「全部」`githubPosts.posts` 生成 detail page，**即使該 post 不在 listing**（`listingPosts` 僅過濾 listing/prev-next/category/tag 派生，不影響 detail 頁是否生成）。
- **三條線正交**：listing selector 明示**不**由 `seo.indexing` / `includeInSitemap` / robots 推導；sitemap selector 明示**不**由 `includeInListings` 推導。此正交性為既有設計紅線。

---

## 4. Confirmed asymmetry

唯一殘留之不對稱 production post：

- 檔案：`content/github/posts/20260504-portable-blog-system-mvp.md`
- state：
  - `contentKind: download`
  - `seo.indexing: noindex-follow`
  - **sitemap excluded**（safety：noindex-* + contentKind download）
  - **robots `noindex, follow`**
  - `includeInListings: true`（Slice 2 backfill 時 Dean 顯式 keep，對抗 default-exclude）
  - **still visible in internal listings**（home / post-list / category / tag）
- warning：`page-noindex-in-listings`
  - 訊息：`seo.indexing="noindex-follow" with includeInListings=true (noindex page may mislead users into a non-indexed page)`
  - 觸發位置：`src/scripts/validate-content.js`（rule：`isNoindex && includeInListings === true`）
- validation result（本 session read-only 量測）：
  - `npm run validate:content` = **`0 / 134 / 106`**
  - `npm run check:validation-report` = **`27 / 0`**
- 此 warning 為 **expected / documented / intentional hold**（MVP post frontmatter inline comment 明載「由 rule 8 page-noindex-in-listings 提示作者覺察」），**不是 blocker**。

---

## 5. Why this is not a live blocking issue

- **noindex 已阻止索引**：robots `noindex, follow` → 搜尋引擎不索引該頁。
- **sitemap 已排除**：safety 已將其排除於 sitemap，不會主動提交索引。
- **listing 可見屬 UX / content-strategy 取捨**：頁面回 200、站內列表可見，僅是「可見但不可索引」的合法但罕見組合；不造成 SEO 危害。
- **不影響 Blogger live**：Blogger 為手貼 HTML，無系統 sitemap / robots 注入；此 asymmetry 限於 GitHub Pages 維度。
- **不影響 footer disclosure**（獨立決策項 Q1）。
- **不影響 `/tags/` nav**（獨立決策項 Q4）。
- **不影響 root legacy `index.html` policy**（獨立決策項 Q5；已於 `1b7ff25` lock）。
- **不需要 deploy**。
- **不需要 backend 操作**（Blogger / Google / GA4 / AdSense / Search Console / Admin 皆不涉及）。

---

## 6. New funnel pair state

- **Blogger-only Bopomofo funnel pair 目前不是 Q6 問題來源**（該 pair 三維度已正確對齊，無 asymmetry）。
  - `content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`（entry）：**應 index / sitemap / listing**（`pageType:article`、`seo.indexing:index`、`includeInSitemap:true`、`includeInListings:true`）。
  - `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`（gated access）：**應 noindex / no sitemap / no listing**（`pageType:gated_download`、`seo.indexing:noindex-follow`、`includeInSitemap:false`、`includeInListings:false`）。
  - 兩篇 `status: draft` / `draft: true` / `github.enabled: false` / `blogger.enabled: true` → 不進 production listing / sitemap，前端不渲染。
- **GitHub / new-domain funnel remains `future_possible_not_active`**（input packet 標記；`github.enabled: false`）。
- **不可從 Blogger funnel 推論 GitHub / new-domain 已啟用**。
- funnel renderer 尚未橋接（見 §7）；funnel pair 為 download 頁三維度對齊之正規範式，與 §4 之 legacy MVP asymmetry 無關。

---

## 7. Renderer gap

- GitHub post-detail（`src/views/pages/post-detail.ejs` + `src/scripts/build-github.js`）仍讀**舊** `download.fileUrl`（直接下載 box）與 `download.landingPage`（landing 分支，含 form / asset placeholder，經 `downloadLandingRendered` registry 解析）。
- GitHub renderer **不讀**新 `gatedDownload` / `downloadFunnel`（`build-github.js` 對此二 schema 零引用）。
- Blogger full template（`src/views/blogger/blogger-post-full.ejs`）目前**無** gated / Google Form / post-submit 分支。
- 此為 funnel renderer deferred 問題，**不應在 Q6 policy lock 中實作**（與 Q6 本體不同層；Q6 是 legacy MVP post 既有狀態，不依賴 funnel renderer）。

---

## 8. CLAUDE.md §3a prose drift（記錄但不修改 CLAUDE.md）

- 目前**數值** baseline 正確：
  - `validate:content` = `0 / 134 / 106`
  - `check:validation-report` = `27 / 0`
- 但若 CLAUDE.md §3a 散文敘述為「production-post warnings = 0」或「warnings 全來自 `content/validation-fixtures/`」，則**散文敘述已 drift**。
- 正確狀態應為：
  - **production expected warning = 1**（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`）
  - 其餘 133 條全來自 `content/validation-fixtures/`
  - 此 1 條為 legacy download / listing **intentional hold**，warning-only、非 blocker。
- 本階段**只在本 docs policy lock 記錄此 drift**；**不修改 CLAUDE.md**。未來若要更正散文，須另開 micro-sync phase（見 §10 Option C）。

---

## 9. Decision（鎖定）

本 phase 鎖定目前決策：

- **不改 MVP post metadata。**
- **不**把 `includeInListings:true` 改成 `false`。
- **不改** listing / sitemap / robots resolver。
- **不改** validator。
- **不 sync** validation baseline numbers。
- **不實作** funnel renderer。

→ Q6 = **deferred content-strategy hold**。MVP post 是否應退出 listings，屬 Dean 內容意圖決策，須另開 content metadata phase（Option B），本 phase 不代決。

---

## 10. Future options（未來可選；僅列出，不實作）

### Option A — 維持 current intentional hold
- **會碰的檔案**：無（純維持）。
- **風險**：低；保留 1 條 expected warning；§4 asymmetry 持續存在但已 documented。
- **驗證方式**：無（無變更）；docs 記錄即可。
- **rollback / stop**：N/A。

### Option B — content metadata fix
- **會碰的檔案**：`content/github/posts/20260504-portable-blog-system-mvp.md`（`includeInListings:true`→`false`）。
- **風險**：消除該 production warning，但**會改變 site listing UX**（MVP post 退出站內列表）；推翻 Dean 既有 keep 決定 → 須 Dean 明確決策。
- **驗證方式**：`npm run validate:content` 期望 `0 / 134 / 106` → `0 / 133 / 105`（消除該 warning）；`npm run check:validation-report` 同步確認；屬 baseline 變動。
- **rollback / stop**：單一 content commit，可 `git revert`；若意外影響其他 post listing 輸出 → STOP。

### Option C — CLAUDE.md prose micro-sync
- **會碰的檔案**：`CLAUDE.md`（僅 §3a 散文：production warning 描述）。
- **風險**：低；只更正散文，**不改數值 baseline**；須遵守「歷史 ledger 不回寫」紀律。
- **驗證方式**：`git diff -- CLAUDE.md` 僅散文行；無 source / baseline 變動。
- **rollback / stop**：docs-only commit，可 `git revert`；若擴大成 ledger 回寫 → STOP。

### Option D — source resolver change
- **會碰的檔案**：`src/scripts/include-in-listings.js`（或 robots / sitemap resolver）。
- **風險**：**不建議**；會破壞 listing / robots / sitemap 三條線正交設計（讓 listing selector 反推 seo.indexing），churn 大、影響既有輸出。
- **驗證方式**：須全量 build byte-identical 比對 + 全 validator regression；高風險。
- **rollback / stop**：任何既有頁輸出改變 → STOP。

### Option E — funnel renderer phase
- **會碰的檔案**：post-detail + Blogger full template + metadata 橋接（§7）。
- **風險**：與 Q6 本體不同層；需等 funnel content / schema / renderer 決策定稿，內容未定前實作 = churn。
- **驗證方式**：另開 funnel renderer phase 之獨立 acceptance。
- **rollback / stop**：本 phase 不啟動。

---

## 11. Cleanup / reopen trigger conditions

下列任一情境發生時，才需要重新打開 Q6：

- 新增 production download page。
- 新增 `gated_download` page（進入 production，非 fixture / 非 draft）。
- 更多 noindex pages 出現在 listings（`page-noindex-in-listings` warning > 1）。
- Dean 決定 MVP post 不應再出現在 listings（→ Option B content metadata phase）。
- GitHub / new-domain funnel 啟用（`future_possible_not_active` → active）。
- funnel renderer 開始實作（§7 renderer gap 橋接）。
- validation warning 數量改變（baseline 0/134/106 或 27/0 變動）。
- CLAUDE.md §3a 需要 state micro-sync（→ Option C）。
- sitemap / robots / listings policy 任何一條被改動。

---

## 12. No-touch scope（本階段不可碰）

- ❌ content posts（尤其 `content/github/posts/20260504-portable-blog-system-mvp.md`）
- ❌ source / settings / `package.json` / lockfile（package-lock / pnpm-lock / yarn.lock）
- ❌ `dist/` / `gh-pages/` / `.cache/` / generated HTML
- ❌ `CLAUDE.md` / `MEMORY.md`
- ❌ Blogger / Google / GA4 / Admin / LearnOops backend
- ❌ funnel renderer / `gatedDownload` / `downloadFunnel` source implementation
- ❌ footer disclosure
- ❌ `/tags/` nav
- ❌ root `index.html`

---

## 13. Validation plan for this docs-only phase

僅允許：

```
git status --short
git status -sb
git diff -- docs/20260626-q6-download-listing-asymmetry-policy-lock.md
git diff --check
git diff --stat
```

可選 read-only validation（本 session 已跑、僅供記錄，**不** sync baseline）：

```
npm run validate:content        # 0 / 134 / 106
npm run check:validation-report # 27 / 0
```

不跑：build / deploy / dev server / Blogger / Google / GA4 / Admin backend。

預期：唯一變更＝新增本 docs 檔；`git diff --check` 無 whitespace / conflict marker 錯誤。

---

## 14. Final status

- 若只新增本 docs-only 文件且 diff 無異常 → 可 commit / push。
- commit message：`docs(policy): lock download listing asymmetry`
- commit 前後回報：changed files / `git diff --stat` / `git status --short` / `git status -sb` / `git log -1 --oneline` / HEAD 是否等於 origin/main / ahead/behind 是否 0/0 / index.lock 是否存在。
- push 後 final read-only freeze：working tree clean / HEAD = origin/main / ahead/behind 0/0 / no index.lock。
- 最後 **STOP**，等待 Dean 下一步指示。

### 硬性 STOP 條件
- baseline 非 `1b7ff25` clean → 立刻 STOP，不修。
- 出現 index.lock → 立刻 STOP，不刪除，先回報。
- 需要修改 docs 以外任何檔案 → STOP。
- 需要修改 content metadata → STOP。
- 需要修改 CLAUDE.md / MEMORY.md → STOP。
- 需要改 validator / source / settings → STOP。
- 需要 build / deploy / dev server → STOP。
- 需要 Blogger / Google / GA4 / Admin / backend → STOP。

---

`VERDICT: Q6 DOWNLOAD/LISTING ASYMMETRY — DOCS-ONLY POLICY LOCK LANDED`
`DECISION: DEFERRED CONTENT-STRATEGY HOLD（intentional, warning-only, non-blocking）`
`NO CONTENT / SOURCE / VALIDATOR / BASELINE / CLAUDE.md CHANGE`
`NO BUILD / DEPLOY / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

（本文件結束）
