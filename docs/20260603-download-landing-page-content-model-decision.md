# 2026-06-03 Download Landing Page Content Model Decision

Phase name: `20260603-am-16-download-landing-page-content-model-decision-docs-only-a`
Date: 2026-06-03 11:38 +0800
Mode: **docs-only decision**（no source / no content / no settings / no templates / no fixtures / no registry mutation / no loader / no renderer / no Admin / no middleware / no CLAUDE.md / no package / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock / no admin-write-cli / no Admin Apply）

---

## 1. Executive Summary

本 phase 是 **docs-only decision**，目的在於正式裁決 internal noindex download landing page 初期應採用哪一種 **content model**（Option A / B / C / D / E），使後續若啟動 renderer implementation 時有可引用之**單一裁決基準**。

本 phase 為純文件裁決，沿用 am-9 renderer preanalysis（`docs/20260603-download-landing-page-renderer-preanalysis.md` §6）已盤點之 Option 比較，將其從「初步傾向」升級為「正式裁決」。

**本 phase 嚴格邊界：**

- ❌ **不**實作 renderer。
- ❌ **不**新增 fixture。
- ❌ **不**修改 production content。
- ❌ **不**改 registry JSON（`download-assets.json` / `download-forms.json` remain empty）。
- ❌ **不**改 source（`src/scripts/` / `src/views/` / `src/styles/` / `src/js/`）。
- ❌ **不**改 templates（`content/templates/`）。
- ❌ **不**改 CLAUDE.md / README.md / 其他 docs。
- ❌ **不**改 `package.json` / lockfile / `dist*/` / `gh-pages` / `.cache` / memory files。
- ❌ **不** build / deploy / Blogger repost / GA4 validation。
- ❌ **不** activate reverse UTM；**不** unblock pm-26 deploy gate。
- ❌ **不** start Admin picker / Admin Apply / middleware / admin-write-cli。
- ❌ **不** 啟動 R4 inactive / R6 coexistence source。

唯一輸出為本檔（`docs/20260603-download-landing-page-content-model-decision.md`）。

**裁決 spoiler（詳見 §5）：**

- **Initial / mid-term model：採 Option D — reuse existing post + `seo.indexing` noindex + explicit `download.landingPage` guard。**
- **Long-term model：保留 Option B — dedicated `contentKind`，待規模化後再升級。**
- **拒絕：Option A（語意污染）/ Option C（無顯著額外好處）/ Option E（無法達成 long-term flow，但與 Final Idle Freeze 等效）。**
- **本 phase 之裁決為 transitional（過渡定論）**：Option D 是 initial commitment，但不是 terminal model；升級 Option B 之條件見 §5.5。
- **本 phase 不進 source / 不進 production migration**；裁決完成後預設 **Final Idle Freeze / EXIT**。

See also：

- `docs/20260603-download-landing-page-renderer-preanalysis.md`（am-9；§6 Option A–E 比較；本檔直接 inherit 並升級為裁決）
- `docs/20260603-download-r6-coexistence-rule-preanalysis.md`（R6 coexistence；recommends defer Option E）
- `docs/20260603-download-r5b-duplicate-checkpoint.md`（R5b checkpoint；baseline inherit）
- `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`（R4a — Option A keep registries empty；R4b NO-GO）
- `docs/20260602-download-r2-not-found-checkpoint.md`（R2 freeze baseline）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series plan）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema 與紅線 R1）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty-registry landing 計畫）
- `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（pm-11；article CTA → landing page → embedded form → Drive ZIP 流程定稿；§8 promote-to-ready gates）
- `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16；DownloadLandingPage / FormConfig / DownloadAsset 草案 schema）
- `docs/20260529-download-landing-page-admin-model-preanalysis.md`（pm-12；Admin ownership boundary）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（preview-url-risk = docs-only authoring policy）
- CLAUDE.md §3.2 / §13 / §16.4 / §21 / §23 / §27 / §29

---

## 2. Current Baseline

Baseline confirmed at start of this phase（2026-06-03 11:38 local）：

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD：`33c809f3339c2f1e657210f9018d5da6c5c41197`（short `33c809f`）
- `HEAD == origin/main`：yes（ahead / behind = `0 / 0`）
- working tree：clean
- latest commit subject：`docs(download): plan landing page renderer`
- `npm run validate:content` → **0 errors / 60 warnings / 53 posts**

### 2.1 Recent commit chain（top of this phase window）

```text
33c809f docs(download): plan landing page renderer
dcd0356 docs(download): plan reference coexistence validation
a25be4a docs(download): record r5b duplicate checkpoint
077c3d1 feat(download): warn on duplicate asset refs
bd94220 docs(download): plan asset ref duplicate validation
```

### 2.2 R-series / consumer status snapshot

| Item | Status |
| --- | --- |
| R1（registry shape / dup-key）| ✅ landed（warning-only；20260601-pm-17）|
| R2（asset / form ref not-found）| ✅ landed（warning-only；`145a548`）|
| R4a（inactive strategy）| ✅ Option A — keep registries empty（20260602-night-14）|
| R4b（inactive source）| ❌ NO-GO；source 未啟動 |
| R5b（intra-post `assetRefs[]` duplicate）| ✅ landed（warning-only；`077c3d1`）|
| R6（coexistence）| 🟡 docs-only preanalysis；**defer**（Option E；`dcd0356`）；source 未啟動 |
| Landing page renderer | ❌ not started；am-9 preanalysis landed（`33c809f`）|
| Admin picker | ❌ not started |
| Production content migration | ❌ zero usage of `assetRefs[]` / `formRef` |

### 2.3 Registry state（empty since `466e471`）

```json
content/settings/download-assets.json
{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }

content/settings/download-forms.json
{ "schemaVersion": 1, "updatedAt": "", "forms":  [], "notes": "" }
```

兩 registry 均維持 **empty**。本 phase 不改動。

### 2.4 Production download content snapshot

掃描 `content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/`：

| Post | status | contentKind | download block? | fileUrl | assetRefs | formRef |
| --- | --- | --- | --- | --- | --- | --- |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | `draft` | `download` | ✅ | `""`（empty）| 無 | 無 |
| 其他 production posts | — | — | ❌ | — | — | — |

- 唯一活 production download post 為 **1 draft phonics post**；`fileUrl` empty；**no refs**。
- validator 不掃 draft（per `loadPosts` filter）；publish 流程不出 dist。
- **production `assetRefs[]` / `formRef` usage = 0**（across blogger / github / shared）。

### 2.5 Dormant rails

- reverse UTM remains **landed but dormant**（per CLAUDE.md §16.4；source pm-24a/b/c 已 push，未 deploy）。
- pm-26 deploy gate remains **BLOCKED**（per CLAUDE.md §3.2）。
- Admin Apply / middleware write / admin-write-cli remain **dormant**。

---

## 3. Decision Context

### 3.1 為什麼 am-9 renderer preanalysis 之後需要 content model decision

am-9（`docs/20260603-download-landing-page-renderer-preanalysis.md`）已完整盤點 renderer 之責任邊界（§5）、registry resolution（§8）、noindex / sitemap / SEO 策略（§9）、build pipeline touch map（§10），並於 §6 列出 Option A–E **但明文「本 phase 不裁決」**（§6 結尾「初步傾向」）。

renderer 之 ground truth 設計取決於 landing page 之 **identity / routing / noindex / CTA semantics**，而這四者全由 content model 決定：

1. **identity**：landing page 是「一篇 post」還是「一個獨立 contentKind 實體」？→ 影響 loader / build glob / Admin 編輯範圍。
2. **routing**：landing page URL 由什麼產生？是否進 posts loop？→ 影響 sitemap 排除是否自動生效。
3. **noindex**：noindex 由 `seo.indexing` 既有 pipeline 驅動，還是新欄位？→ 影響 build-github robots meta 與 build-sitemap exclusion 是否 reuse。
4. **CTA semantics**：article 之 `download.fileUrl` 應指向 landing page，還是新增 `download.landingPage` 欄位？→ 影響 renderer 之 guard 條件與紅線（CTA 不直連 Form / Drive）。

若不先裁決 content model 即直接寫 renderer，等同在 source phase 倉促決議上述四個維度，違反 R-series 既有 cadence（docs-only preanalysis → decision → read-only acceptance → source implementation → checkpoint）。

### 3.2 為什麼不應直接進 renderer source

per am-9 §15.1：long-term download flow 之**多個前置條件未滿足**——

- 真實 Google Drive asset URL 未就緒（registry empty；唯一 draft `fileUrl: ""`）。
- 真實 Google Form embed URL 未就緒（registry empty；無 ready form）。
- content model 裁決尚未 docs-accept（**即本 phase 之任務**）。
- production migration plan 未啟動。

content model decision 是 renderer source 之**前置 gate**；本 phase 完成此 gate 後，renderer source 仍需獨立 user prompt（見 §14）。

### 3.3 為什麼不應直接進 production migration

per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §8 之 promote-to-ready gates：landing page URL / noindex / embedded form / Drive ZIP / 人工點測**全數未滿足**。唯一活 download draft（phonics）保持 draft 是目前最安全狀態（pm-10 / pm-11 既有結論）。content model decision **不**觸發任何 production content 變更。

### 3.4 為什麼 content model 要先決定 identity / routing / noindex / CTA

四者互鎖：

```text
content model（identity）
  → 決定 landing page 是否進 posts loop（routing）
    → 決定 sitemap exclusion 是否 reuse 既有 noindex-* 分支（noindex）
      → 決定 article CTA 是指 fileUrl 還是新 landingPage 欄位（CTA semantics）
        → 決定 renderer 之 guard 條件（§7）
```

任一維度未定，renderer guard 即無法安全設計（避免把一般 download post 誤判為 landing page）。

---

## 4. Candidate Content Models

以下完整比較 Option A–E。評估維度：implementation complexity / source touch scope / content authoring experience / validation impact / sitemap-noindex support / canonical-robots behavior / GitHub build impact / Blogger build impact / Admin picker dependency / production migration risk / registry dependency / fit to current project state。

本節之 ground truth 已於本 phase read-only 複驗：

- `src/scripts/build-github.js` lines 297–308：`seo.indexing` → `seo.robots`（`index` → `index, follow`；`noindex-follow` → `noindex, follow`；`noindex-nofollow` → `noindex, nofollow`）+ `contentKind === 'download'` fallback → `noindex, follow`。
- `src/scripts/build-sitemap.js` lines 128–134：`seo.indexing === 'noindex-follow' | 'noindex-nofollow'` → `continue`（排除）；`seo.indexing !== 'index' && contentKind === 'download'` → `continue`（排除）。
- `src/views/pages/post-detail.ejs` lines 106–123：download box guard = `post.download && post.download.enabled && post.download.fileUrl`；CTA `href={fileUrl} download`，**無** target / rel。

### Option A：沿用 post `download.fileUrl` 作為 landing page URL

- **描述**：landing page 不獨立建檔；`download.fileUrl` 語意正式收斂為「指向 internal noindex landing page URL」。landing page HTML 由 renderer 透過 registry + 樣板生成。
- **Implementation complexity**：中（renderer 須自處理 landing page HTML 生成 + noindex 注入 + sitemap exclusion 自設機制）。
- **Source touch scope**：build-github（新 landing render branch）/ post-detail.ejs / renderer 自造 noindex。
- **Content authoring experience**：差；`fileUrl` 字面易被誤解為直連檔案（per pm-11 §7 Option A「語意不直觀」）。
- **Validation impact**：低；D1 / D2 / D3 / S 保持；但 D3 之 `^https?://` pattern 可能需考慮 internal relative path（per `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md` 仍 reject relative）。
- **Sitemap / noindex support**：⚠️ 部分；landing page 不在 posts loop → build-sitemap 不會自動排除 → 須 renderer 自設 exclusion 機制。
- **Canonical / robots**：須 renderer 端 hardcode noindex → 雙重 source of truth 風險。
- **GitHub build impact**：中。
- **Blogger build impact**：低（landing page GitHub-only）。
- **Admin picker dependency**：低。
- **Production migration risk**：低（既有 `fileUrl` 改為 landing URL）。
- **Registry dependency**：renderer resolve refs（registry 仍 empty）。
- **Fit to current state**：⚠️ 過渡可接受，但缺乏 landing page 獨立 content / metadata；難管理多個 landing page。

### Option B：新增 dedicated landing page `contentKind`（如 `download-landing` / `downloadLandingPage`）

- **描述**：新增 `contentKind: "download-landing"`，用 frontmatter 描述每個 landing page。
- **Implementation complexity**：高（新 contentKind enum + 新 render branch + 新 template + validator enum 接受 + sitemap scan 擴張）。
- **Source touch scope**：load-posts.js / build-github.js / 新 `download-landing.ejs` / validate-content.js / build-sitemap.js。
- **Content authoring experience**：佳；landing page 為一級實體；欄位語意清楚。
- **Validation impact**：中；需新 `download-landing-*` family（noindex required / formRef required 等）；baseline +N warnings（fixture-driven）。
- **Sitemap / noindex support**：✅ full；可 reuse `seo.indexing` pipeline（landing page 仍走 posts loop 或新 collection，但須接入 build-sitemap exclusion）。
- **Canonical / robots**：✅ reuse build-github robots meta。
- **GitHub build impact**：高。
- **Blogger build impact**：低（Blogger 端無 landing page）。
- **Admin picker dependency**：中（picker 須挑 landing page slug 寫入 article ref）。
- **Production migration risk**：中（既有 draft 須建對應 landing page entry + 回填 `landingPageRef`）。
- **Registry dependency**：renderer resolve refs。
- **Fit to current state**：long-term ideal；但**現在過早 normalize**——只有 1 個 draft、registry empty、無 real form/asset；新增 build branch + Admin loader 之成本與當前需求不成比例。

### Option C：新增 `content/shared/pages/` 或 `content/download/pages/` 目錄

- **描述**：landing page 內容放專屬目錄；不依賴既有 github / blogger 雙站結構。
- **Implementation complexity**：中高（load-posts glob 擴張 + build-github 從新目錄 render + build-sitemap scan 擴張）。
- **Source touch scope**：load-posts.js（sourceCollection 擴張）/ build-github.js / build-sitemap.js。
- **Content authoring experience**：中（新目錄結構認知成本）。
- **Validation impact**：類似 Option B + `processMarkdownEntry` 之 sourceCollection 擴張。
- **Sitemap / noindex support**：✅ 可 reuse，但 build-sitemap 須擴張 scan range。
- **Canonical / robots**：✅ reuse。
- **GitHub build impact**：中高（scan 擴張）。
- **Blogger build impact**：低。
- **Admin picker dependency**：中（同 Option B）。
- **Production migration risk**：中。
- **Registry dependency**：renderer resolve refs。
- **Fit to current state**：Option B 之變體；跨站 shared 結構無顯著額外好處；增加 build glob routing 複雜度。**無採用理由優於 B**。

### Option D：existing post model + `seo.indexing=noindex` + explicit `download.landingPage` guard

- **描述**：landing page 為一篇普通 post，`seo.indexing = "noindex-follow"`（或 `"noindex-nofollow"`），contentKind 可為 `download` 或 `page`；**不**新增 contentKind。額外加一個 explicit `download.landingPage` boolean guard 讓 renderer 明確識別「這篇是 landing page」（避免與一般 download post 混淆，per §7）。
- **Implementation complexity**：低（reuse 既有 build-github / build-blogger / build-sitemap pipeline；renderer 只在 post-detail 加 guarded branch）。
- **Source touch scope**：post-detail.ejs（add landing render branch via guard）；build-github / build-sitemap **零改**（既有 `seo.indexing` 分支已涵蓋）。
- **Content authoring experience**：佳；作者沿用既有 post frontmatter，只多設 `seo.indexing: "noindex-follow"` + `download.landingPage: true` + `download.formRef` + `download.assetRefs[]`。
- **Validation impact**：零至低；既有 SEO interlock S（`download-content-should-be-noindex`）已涵蓋 `contentKind === 'download'` 之 noindex 要求；可選 add `download-landing-noindex-required`（warning-only，未來）。
- **Sitemap / noindex support**：✅ **完美 reuse**；landing post 走 posts loop → build-sitemap line 130 之 `noindex-*` 排除分支自動生效。
- **Canonical / robots**：✅ reuse build-github line 300–303 robots meta；canonical 走既有 post canonical 邏輯（self-canonical，per am-9 §7.4）。
- **GitHub build impact**：極小（post-detail guarded branch）。
- **Blogger build impact**：可選（landing page GitHub-only，Blogger 端可不 render）。
- **Production migration risk**：低；既有 phonics draft 可逐步加 `seo.indexing` + `landingPage` + refs，無 contentKind 變更。
- **Registry dependency**：renderer resolve refs（registry 仍 empty → graceful placeholder，per am-9 §8.2）。
- **Fit to current state**：✅ **mid-term sweet spot**；reuse 90%+ 既有 pipeline；長期可低成本 promote 至 Option B。

### Option E：暫不建立新 content model，只保留 `fileUrl` legacy

- **描述**：landing page 概念暫不落地；`download.fileUrl` 維持 raw URL；renderer 不實作。
- **Implementation complexity**：零。
- **Source touch scope**：零。
- **Content authoring experience**：n/a（無 landing page）。
- **Validation impact**：零。
- **Sitemap / noindex support**：既有 contentKind=download fallback `noindex, follow` 適用於文章本身；landing page 概念不存在。
- **Canonical / robots**：不變。
- **GitHub / Blogger build impact**：零。
- **Admin picker dependency**：無。
- **Production migration risk**：零。
- **Registry dependency**：無。
- **Fit to current state**：最保守；保留所有彈性；但 long-term flow 之主要設計目標（form gate + Drive asset 中介）**永遠**無法達成。**與 Final Idle Freeze 等效**。

### Option comparison summary

| Option | Impl complexity | Source touch | Authoring UX | Validate impact | SEO reuse | Build impact | Admin dep | Migration risk | Long-term fit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | mid | mid | poor | low | ⚠️ partial（自造）| mid | low | low | 過渡 |
| B | high | high | good | mid（new family）| ✅ full | high | mid | mid | **long-term ideal** |
| C | mid-high | mid-high | mid | mid | ✅ full | mid-high | mid | mid | B 之變體（無額外好處）|
| D | **low** | **low** | **good** | **low** | ✅ **full** | **low** | low | **low** | **mid-term sweet spot** |
| E | 0 | 0 | n/a | 0 | partial（無 landing）| 0 | 0 | 0 | 保守；無法達成長期目標 |

---

## 5. Recommended Decision

### 5.1 Recommended initial model：**Option D**

**裁決：採 Option D — existing post model + `seo.indexing=noindex` + explicit `download.landingPage` guard 作為 initial / mid-term landing page content model。**

理由：

1. **最低 source touch / 最高 pipeline reuse**：build-github robots meta（line 300–303）與 build-sitemap noindex exclusion（line 130）**既有分支即可涵蓋**；landing page 走 posts loop 自動受益。renderer 只需在 `post-detail.ejs` 加一個 guarded branch。
2. **零至低 validation impact**：既有 SEO interlock S 已涵蓋 download noindex 要求；不強迫新 rule family。
3. **content authoring 對作者友善**：沿用既有 post frontmatter；無新目錄 / 無新 contentKind 認知成本。
4. **production migration risk 最低**：phonics draft 可逐步加欄位，不改 contentKind。
5. **explicit `download.landingPage` guard 解決 identity 模糊**：明確區分「landing page」與「一般 download post」，避免 renderer 誤判（per §7）。
6. **平滑升級路徑**：當教具下載規模化時，可低成本從 Option D normalize 至 Option B（dedicated contentKind），既有 `seo.indexing` + refs 語意可沿用。

### 5.2 Recommended long-term model：**Option B**

**保留 Option B（dedicated `contentKind`）作為 long-term model**，待以下任一成立時再升級：

- 教具下載數量規模化（多個 landing page，Option D 之 post 混雜難管理）。
- Admin picker 需要把 landing page 當一級實體挑選 / 過濾。
- landing page 需獨立於 post 之 lifecycle（如獨立 archive / 獨立 SEO 策略）。

### 5.3 Rejected options and reasons

| Option | 拒絕理由 |
| --- | --- |
| **A** | `fileUrl` 字面語意誤導（易被當直連檔案）；sitemap exclusion 須 renderer 自造（雙重 source of truth）；缺乏 landing page 獨立 metadata。Option D 在相同成本下提供更清楚的 guard + 既有 pipeline reuse。 |
| **C** | Option B 之變體；跨站 shared 目錄無顯著額外好處；增加 build glob routing 複雜度。若要 dedicated 實體，直接走 B 更乾淨。 |
| **E** | 雖最保守，但**永遠無法達成 long-term flow**（form gate + Drive asset 中介）。本 phase 之裁決目的即為「選定可推進之 initial model」；E 等於不選。**但若 user 決定不推進 user-facing 體驗，E 與 Final Idle Freeze 等效**，仍是合法 fallback。 |

### 5.4 Decision finality：**transitional（過渡定論）**

- 本裁決為 **transitional**：Option D 是 initial commitment，但**不是 terminal model**。
- Option D 為 mid-term；Option B 為 long-term target。
- 裁決本身（「初期走 D、長期走 B」）為 **final**；但「何時從 D 升 B」為 open，由 §5.5 條件 + 未來獨立 phase 決定。

### 5.5 What must be true before upgrading to long-term Option B

升級 Option D → Option B 之前置條件（任一未滿足即不升級）：

- [ ] landing page renderer（Option D 形態）已 land 並 verified（至少 single-post 可 render）。
- [ ] 至少 1 篇 production landing post 採 Option D 成功 render（含 real form + real asset）。
- [ ] 教具下載數量達到「post 混雜難管理」之臨界（多個 landing page）。
- [ ] Admin picker 需求明確要求 landing page 為一級可選實體。
- [ ] Option B 之新 contentKind enum / validator family / fixture 計畫已 docs-only preanalysis。
- [ ] user 明確 approve 升級（不自動推進）。

---

## 6. Recommended Frontmatter Shape（草案，本 phase 不新增 content）

以下為 Option D 形態下 landing page post 之**建議 frontmatter 草案**；本 phase **不**新增任何 content / fixture，僅記錄欄位語意與 required / optional / legacy / forbidden 分類。

```yaml
# === Landing page post（Option D 形態；草案，本 phase 不落地）===
title: "注音練習卡下載"                    # required
slug: "phonics-practice-sheet-download"    # required（stable，per §8）
status: "draft"                            # required（draft → ready 須過 promote gates）
contentKind: "download"                    # required（Option D：沿用 download，不新增 contentKind）

publishTargets:
  github:
    enabled: true                          # landing page GitHub-only（per §8）
    mode: "full"
  blogger:
    enabled: false                         # Blogger 端不建 landing page

seo:
  indexing: "noindex-follow"               # required for landing page（驅動 noindex + sitemap exclusion）
  canonical: "auto"                        # self-canonical（per §8）

download:
  enabled: true                            # required
  landingPage: true                        # required（explicit guard；區分 landing page vs 一般 download post）
  formRef: "phonics-form"                  # optional（registry resolve；empty registry → placeholder）
  assetRefs:                               # optional（registry resolve；empty registry → placeholder）
    - "phonics-zip"
  fileUrl: ""                              # legacy / optional；landing page 形態下不應填 Drive direct URL
  fileType: "ZIP"                          # optional（顯示用）
  description: "填寫表單後取得內含 3 份 PDF 的 ZIP 檔。"   # optional
  licenseNote: "本素材僅供個人、家庭與教學使用..."          # optional

description: "..."                         # optional（meta description）
searchDescription: "..."                   # optional
cover: ""                                  # optional
coverAlt: ""                               # optional（cover 有值時建議填）
```

### 6.1 欄位 required / optional / legacy / forbidden 分類（Option D initial）

| 欄位 | 分類 | 說明 |
| --- | --- | --- |
| `title` | **required** | landing page 標題 |
| `slug` | **required** | stable slug（per §8）|
| `status` | **required** | draft / ready / published / archived |
| `contentKind` | **required** | Option D 沿用 `download`（不新增 contentKind）|
| `seo.indexing` | **required（landing page）** | 必為 `noindex-follow` / `noindex-nofollow`（per §8 / §10）|
| `seo.canonical` | optional | self-canonical（`auto` 或顯式 self URL）|
| `download.enabled` | **required** | 必為 `true` |
| `download.landingPage` | **required（Option D guard）** | 必為 `true`；renderer 之 landing 識別依據（per §7）|
| `download.formRef` | optional | registry resolve；empty 時 placeholder |
| `download.assetRefs[]` | optional | registry resolve；empty 時 placeholder |
| `download.fileUrl` | **legacy / optional** | landing page 形態下**不應**填 Drive direct URL；若填應為 internal landing URL（過渡）；**forbidden**：直連 Google Form / Google Drive（紅線，per §13）|
| `download.fileType` / `description` / `licenseNote` | optional | 顯示用 |
| `description` / `searchDescription` | optional | meta |
| `cover` / `ogImage` | optional | 見 §6.2 |
| respondent data 任一欄位（email / 姓名 / 答覆）| **forbidden** | 永不進 frontmatter（紅線 R1，per §9 / §13）|

### 6.2 cover / ogImage 是否需要

- **不強制**。landing page 為 noindex，不主動推廣到社群（per am-9 §9.4）。
- 若設 OG metadata：使用者手動分享 landing URL 時仍能看到正確 OG card；但搜尋引擎不索引。
- `og:image` 可用 asset preview 圖；**forbidden**：og:image / OG metadata 不得包含 Google Drive direct download URL（紅線，per §13）。
- 結論：cover / ogImage 為 **optional**；初期可不填。

---

## 7. Guard Conditions

定義未來 renderer source phase 判斷「這篇 post 是 landing page」之安全 guard。目標：**避免一般 download post 被誤判為 landing page**，同時避免 landing page 未被識別。

### 7.1 候選 guard 比較

| Candidate guard | 描述 | 誤判風險 | 推薦 |
| --- | --- | --- | --- |
| **G-a：`seo.indexing === noindex-* && download.formRef` 存在** | 以「noindex + 有表單」推斷 | ⚠️ 中；任何 noindex 的 download post 若試填 formRef 即被當 landing page；formRef 為 optional 時又漏判 | ❌ 不單獨使用 |
| **G-b：`contentKind === 'downloadLandingPage'`** | Option B 形態之 contentKind 判斷 | 低 | ⏭ 留待 Option B；Option D 不適用 |
| **G-c：explicit `download.landingPage === true`** | 顯式 boolean guard | **最低**；作者明確宣告 | ✅ **推薦（Option D 主 guard）** |
| **G-d：path / directory（如 `content/*/pages/`）** | 以目錄判斷 | 低，但 Option D 不引入新目錄；改目錄 = Option C | ❌ Option D 不採 |
| **G-e：`status` 判斷** | 以 status 推斷 | 高；status 與 landing identity 正交 | ❌ 不採 |

### 7.2 推薦 guard（Option D）

**主 guard：explicit `download.landingPage === true`（G-c）。**

renderer 之 landing branch guard 建議為：

```text
isLandingPage =
  post.download
  && post.download.enabled === true
  && post.download.landingPage === true
```

並建議**疊加 SEO 一致性**（非 guard，但 renderer / validator 應提示）：

```text
landing page 應 seo.indexing ∈ { noindex-follow, noindex-nofollow }
（不滿足時 warning，未來 download-landing-noindex-required；本 phase 不實作）
```

理由：

1. **explicit boolean 最不易誤判**：作者明確宣告，renderer 不需推斷。
2. **與既有 download box guard 正交且相容**：既有 `post.download && enabled && fileUrl`（post-detail.ejs line 106）渲染「直連下載 box」；landing page guard 多一個 `landingPage === true` 分支，兩者可在 renderer 端明確分流（landing page render form embed + asset section；一般 download post render 既有 download box）。
3. **不依賴 formRef 存在**：formRef 為 optional（registry empty 過渡期可能未填）；用 formRef 當 guard 會漏判。
4. **不引入新目錄 / 新 contentKind**：保持 Option D 之低 source touch。

### 7.3 為何不可用 formRef-only / noindex-only 當 guard

- **noindex-only**：許多一般 download post（contentKind=download fallback）本就 noindex；無法區分 landing page 與一般 download post。
- **formRef-only**：formRef optional；empty registry 過渡期常未填 → 漏判；且一般 post 試填 formRef 會誤判。
- 因此必須 explicit `download.landingPage === true`。

---

## 8. URL / Routing Decision

| 問題 | 裁決 |
| --- | --- |
| 初期 landing page 是否 GitHub-only？ | ✅ **Yes，GitHub-only**。GitHub Pages 端可完整本機預覽 + 既有 noindex / sitemap pipeline；Blogger 端 noindex 須後台手動，不適合動態 landing page（per am-9 §7.1）。 |
| Blogger 文章 CTA 應連往哪裡？ | 跨站連到 **GitHub Pages landing page URL**（透過 `relatedLinks` 或 `download.fileUrl` 之 internal landing URL）；reverse UTM 由 §16.4 機制處理但**本 phase 不解除 dormancy**；renderer 不依賴 reverse UTM activation。**Blogger CTA 不直連 Google Form / Drive**（紅線）。 |
| landing page 是否應有 stable slug？ | ✅ **Yes**。article CTA 連向 landing URL；slug 變動會 break CTA（per am-9 §7.5）。 |
| URL 是否由 slug 產生？ | ✅ **Yes**。Option D 下 landing page 為 post，URL = `/posts/<slug>/`（既有 route）；或未來可考慮 `/downloads/<slug>/`，但初期沿用既有 posts route 以零 routing 改動為佳。 |
| 是否需要 source article reference？ | **Optional / 不強制**。Option D 下 landing page 為獨立 post；article → landing 之關聯由 article 端 `download.fileUrl`（指 landing URL）或 `relatedLinks.kind: internal` 表達。renderer **不**維護 reverse sourceArticleRefs index（避免 build-time 開銷，per am-9 §5.2）。 |
| canonical 應 self-canonical 還是指回原文章？ | ✅ **self-canonical**。landing page 為 noindex；canonical 指文章會引入「indexable alternate」矛盾訊號；landing 內容（form embed + asset）與文章不同，非同一資源 alternate（per am-9 §7.4）。 |
| noindex page 是否應進 sitemap？ | ❌ **No**。reuse build-sitemap line 130 之 `noindex-*` 排除分支；Option D 自動受益。 |
| 是否避免 search users 直接進 landing page？ | ✅ **Yes**（noindex landing page 核心目的）。noindex meta + sitemap exclude + article CTA 為唯一入口（除直接輸入 URL）；article remains indexable（per am-9 §7.6）。robots.txt **不**額外封鎖（noindex 為正確機制，非 disallow）。 |

---

## 9. Registry Relationship

| 問題 | 說明 |
| --- | --- |
| landing page 如何引用 asset / form？ | landing post frontmatter 之 `download.assetRefs[]` → `settings.downloadAssets[].assetId`；`download.formRef` → `settings.downloadForms[].formId`。renderer 透過 `src/scripts/load-settings.js` 既有 read-only loader（`settings.downloadAssets` / `settings.downloadForms`）resolve。 |
| 是否新增 loader？ | ❌ **No**。reuse 既有 `readJsonOptional` loader（Phase 20260601-pm-11）；不新增專屬 loader（per am-9 §8.1）。 |
| empty registry 下如何 fallback？ | **graceful placeholder render**：assetRefs / formRef 在 empty registry 下 → renderer 顯示「下載暫不開放 / 表單暫不可用」placeholder，**不** crash / 404 / 503；landing page HTML 仍生成（per am-9 §8.2）。 |
| duplicate / coexistence 與 renderer 的關係？ | R5b duplicate → renderer 去重 render（顯示一次）；R6 coexistence（defer）→ renderer 允許 `assetRefs + formRef` 共存（long-term 正確模型，per R6 §6 C4）；R2 not-found → placeholder（per am-9 §8.3）。 |
| 是否會改 registry？ | ❌ **No**。registries remain **empty**；renderer preanalysis / content model decision 均不需 registry data（per am-9 §8.6）。 |
| 為何 Google Form response data 不進 repo？ | 紅線 R1（per CLAUDE.md §3.2 / pm-20 §4）：respondent data（email / 姓名 / 答覆 / Sheet rows）**永遠**留在 Google Forms / Sheets；registry 只管 asset / form **configuration**（embedUrl / driveUrl / label 等），**永不**含 respondent data / access token / API key / OAuth secret。renderer **永不**呼叫 Google Sheets API、**永不** import respondent rows。 |

---

## 10. Validation Implications

未來是否需要新增 validation rules（**本 phase 不實作**）：

| 問題 | 分析 |
| --- | --- |
| landing page 是否必須 noindex？ | 建議 **yes**；候選 rule `download-landing-noindex-required`（warning-only）：`download.landingPage === true` 但 `seo.indexing ∉ noindex-*` → warn。但既有 SEO interlock S（`download-content-should-be-noindex`）已部分涵蓋 `contentKind === 'download'`；Option D 下多數情形已被 S 捕捉。待 renderer 落地後再決定是否新增。 |
| landing page 是否必須有 formRef？ | **未定**；取決於是否所有 landing page 都 form-gated。若允許「純 asset 下載（無 form）」則 formRef optional。候選 `download-landing-missing-form` 待 content model 實際使用形態確認後再決定。 |
| landing page 是否允許 assetRefs only？ | 建議 **yes**（C2 gray zone，per R6 §6）；無 form gating 之純資產下載合理；renderer 從 assetRefs 推導下載。 |
| landing page 是否允許 fileUrl only？ | 建議 **yes（過渡）**；fileUrl 指 internal landing URL 為 Option A/D 過渡形態；但 landing page 本身之 fileUrl 不應指 Drive direct（紅線）。 |
| fileUrl vs refs coexistence？ | R6 coexistence 已 **defer**（Option E）；`fileUrl + assetRefs + formRef` 共存為 long-term 合法（per R6 §6 C4/C7）；不新增 coexistence error。 |
| source article reference 驗證？ | **不強制**；Option D 下不維護 sourceArticleRefs；若未來採 ref，需 dangling-ref 驗證（per pm-16 §13）。 |
| migration validation？ | 不在本 phase；production migration 為獨立 phase（per §12）。 |
| validate baseline 未來可能如何移動？ | 若新增 `download-landing-noindex-required` + fixture：+1 fixture / +1 warning（fixture-driven）。renderer fixture（Option D graceful placeholder 驗證）：+1~2 fixtures / +1~2 warnings。production 不引入 fixture → production 不移動 baseline。 |
| 是否應先用 fixture 再碰 production？ | ✅ **Yes**。任何新 rule / renderer 行為先以 `content/validation-fixtures/` 驗證；**production content 永遠最後且獨立 phase**（per §12）。mirror R-series cadence。 |

---

## 11. Build / Renderer Implications

未來 source phase 可能涉及（**本 phase 不實作**）：

| 模組 | Option D 預期 | 說明 |
| --- | --- | --- |
| `src/views/pages/post-detail.ejs` | **modify**（add guarded landing branch）| 在既有 download box（line 106）之外，加 `download.landingPage === true` 分支 render form embed + asset section；**append 不改寫**。 |
| `src/scripts/build-github.js` | **reuse**（robots / canonical 既有）| 不改 robots meta 邏輯（line 300–303 已涵蓋 `seo.indexing`）；canonical 走既有 post 邏輯。 |
| `src/scripts/build-sitemap.js` | **reuse / no-op** | line 130 之 `noindex-*` 排除已涵蓋；Option D landing post 自動排除；**零改**。 |
| `src/scripts/load-settings.js` | **reuse**（已 expose registries）| 不擴張 loader。 |
| `src/scripts/load-posts.js` | **no-op**（Option D）| 不新增 contentKind / collection。 |
| `src/scripts/validate-content.js` | **optional later** | 可選新增 `download-landing-noindex-required`（待 renderer 落地後）。 |
| registry JSON | **untouched / empty** | renderer graceful placeholder 即可在 empty registry 下運作。 |
| `src/scripts/build-blogger.js` | **avoid initially** | landing page GitHub-only；Blogger 端不建 landing page（避免 Blogger 後台 noindex 手動成本）。 |
| Admin picker / Admin UI | **wait** | 等 renderer 邊界穩定後獨立 phase（per §14 Candidate F）。 |

關鍵原則：

- renderer 第一批應「**append 而非改寫**」（post-detail 加 guarded branch）。
- build-blogger 維持絕對最小變動（landing page 永遠 GitHub-only）。
- Admin picker 必須等 renderer 邊界穩定。

---

## 12. Migration Policy

明確寫出：

- ❌ **不做 production migration now**。
- ❌ **現有 production phonics draft 不自動轉 landing page**；保持 draft（per pm-11 §6 / §9）。
- ❌ **registry remains empty**。
- ❌ real Google Form embed URL / real Drive asset URL / content promotion plan 未齊前，**不碰 production**。
- ✅ migration 須**獨立 phase**、**明確 user approval**、並先有 **rollback / acceptance plan**。
- ✅ promote-to-ready gates（per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §8）全數滿足前，phonics draft **不** promote。
- ✅ migration 應採 **fixture-first**：先以 validation fixture 驗證 Option D landing page 形態，再碰 production（per §10）。

---

## 13. Red Lines / Governance

以下紅線於本 phase 與未來 renderer / migration phase **永遠 enforced**：

- ❌ article CTA **不得**直接導 Google Form。
- ❌ article CTA **不得**直接導 Google Drive。
- ❌ Google Form respondent data **不得**進 repo / Admin static files / settings registry。
- ❌ 不得在 renderer 未成熟前強迫 production migration。
- ❌ 不得因 landing page 需求解除 reverse UTM / pm-26 gate。
- ✅ reverse UTM remains **dormant**。
- ✅ pm-26 deploy gate remains **BLOCKED**。
- ✅ Admin Apply / middleware write / admin-write-cli remain **dormant**。
- ✅ registries remain **empty**。
- ✅ landing page **永遠** noindex + sitemap-exclude；不得提供 indexable 下載直連 bypass route。
- ✅ article remains **indexable**；renderer 不得連帶把 article 設 noindex。
- ✅ 本 phase docs-only：no build / no deploy / no Blogger repost / no GA4 validation。

---

## 14. Candidate Next Phases

每個候選給：safety / expected file scope / blockers / expected validate impact / recommendation（do now / defer / reject）。本 phase **不**啟動任何項。

| Candidate | 描述 | Safety | Expected file scope | Blockers | Validate impact | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| **A：content model decision acceptance（read-only cross-check）** | read-only 複核本裁決一致性 | ✅ safe（read-only）| 0（read-only）| 無 | 0 | **do now（next safest step）** |
| **B：renderer implementation preflight（docs-only）** | 規劃 Option D renderer source 邊界 | ✅ safe（docs-only）| +1 docs | 本裁決 accepted | 0 | defer（待 user prompt）|
| **C：renderer source implementation（Option D）** | post-detail guarded branch + fixture | ⚠️ source | post-detail.ejs / +1~2 fixtures | preflight landed | +1~2 warnings | defer |
| **D：`download-landing-noindex-required` rule preanalysis** | 規劃 landing noindex rule | ✅ safe（docs-only）| +1 docs | renderer landed | 0 | defer |
| **E：R6 source / R4 inactive source** | coexistence / inactive rules | ⚠️ source | validate-content.js / fixtures | R6 已 defer（Option E）；R4a Option A | varies | defer / reject（per R6 §12）|
| **F：Admin picker preanalysis** | Admin registry consumer 雛形 | ✅ safe（docs-only）| +1 docs | renderer 邊界穩定（per am-9 §12.4）| 0 | **defer**（renderer 未成熟；前置條件全未滿足）|
| **G：direct production migration** | phonics draft → landing page | 🔴 unsafe now | production content / registry | promote-to-ready gates 全未滿足；renderer 未實作；real form/asset 未齊 | 0（production 不引入 fixture）| **reject now**（須獨立 phase + explicit approval + rollback plan，per §12）|

---

## 15. Recommendation

本 phase 之最保守結論：

- ✅ **接受 Option D as initial / mid-term model**（per §5.1）。
- ✅ **保留 Option B as long-term model**（per §5.2；升級條件 §5.5）。
- ❌ **不**現在進 source（renderer / validator）。
- ❌ **不**現在進 production migration。
- ➡️ **下一步應先做 acceptance cross-check（read-only）**（Candidate A）。
- ✅ **Final Idle Freeze / EXIT**（本 phase 結束後預設狀態）。

本 phase 對 source / content / settings / templates / fixtures / registry / loader / CLAUDE.md / package / dist / gh-pages / memory 均**零**動作；唯一變動為新增本 docs 檔。baseline 維持 **0 errors / 60 warnings / 53 posts**。所有 dormant rails（reverse UTM / pm-26 / Admin Apply / middleware / admin-write-cli）保持 dormant；所有紅線（§13）保持 enforced。

---

## Appendix A — Cross-reference index

- Renderer preanalysis（am-9）：`docs/20260603-download-landing-page-renderer-preanalysis.md`
- R6 coexistence preanalysis：`docs/20260603-download-r6-coexistence-rule-preanalysis.md`
- R5b checkpoint：`docs/20260603-download-r5b-duplicate-checkpoint.md`
- R4a strategy：`docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`
- R2 checkpoint：`docs/20260602-download-r2-not-found-checkpoint.md`
- R-series plan：`docs/20260602-download-registry-aware-validation-preanalysis.md`
- Registry schema decision：`docs/20260531-download-asset-form-settings-registry-schema-decision.md`
- Empty-registry plan：`docs/20260531-download-empty-registry-implementation-plan.md`
- Landing page flow decision（pm-11）：`docs/20260529-reverse-utm-download-landing-page-flow-decision.md`
- Landing page schema preanalysis（pm-16）：`docs/20260529-download-landing-page-schema-preanalysis.md`
- Landing page admin model preanalysis（pm-12）：`docs/20260529-download-landing-page-admin-model-preanalysis.md`
- preview-url-risk policy：`docs/20260530-download-fileurl-preview-url-risk-policy.md`
- Governing policy：CLAUDE.md §3.2 / §13 / §16.4 / §21 / §23 / §27 / §29
- Source of truth at HEAD `33c809f`：
  - `src/scripts/build-github.js`（lines 297–308 `seo.indexing` → `seo.robots`；contentKind=download fallback `noindex, follow`）
  - `src/scripts/build-sitemap.js`（lines 128–134 `noindex-*` 與 contentKind=download 排除）
  - `src/views/pages/post-detail.ejs`（lines 106–123 download box guard `download && enabled && fileUrl`；CTA `href={fileUrl} download`，無 target/rel）
  - `src/scripts/load-settings.js`（registry read-only loader，Phase 20260601-pm-11）
  - `src/scripts/validate-content.js`（D1 / D2 / D3 / S / Option 6 / Option A / R1 / R2 / R5b cascade）
  - `content/settings/download-assets.json` / `download-forms.json`（empty registries）
- Active production download draft：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（status = draft；fileUrl: ""；無 assetRefs / formRef）
- Download template：`content/templates/blogger-download-template.md`（無 assetRefs / formRef；fileUrl: ""）

---

（本文件結束）
