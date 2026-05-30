# 20260530 Download Validation S1 / S2 Merge-vs-Split Decision

> Phase: `20260530-night-3-download-validation-s1-s2-merge-decision-docs-only-a`
> Date: 2026-05-30 21:28 +0800
> Scope: **docs-only**（無 source / content / settings / templates / package / fixture / dist / gh-pages 變更）

---

## A. Executive Summary

- 本文件**只**裁決 S1 / S2 noindex validation 之**形狀**（合併 vs 拆分 vs 暫不實作）。
- ❌ 不做 source implementation（`src/scripts/validate-content.js` 一行不動）。
- ❌ 不新增 fixture（`content/validation-fixtures/` 不動）。
- ❌ 不改 validate baseline（預期維持 0 errors / 45 warnings / 40 posts）。
- ❌ 不處理 `formRef` / `assetRefs[]` / settings registry / Google Form / download landing page renderer。
- ❌ 不改 content / settings / templates / package / dist / gh-pages。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。
- **裁決結論（preview，詳 §F）**：採 **Option Beta** —— S1 / S2 合併為單一 rule `download-content-should-be-noindex`。

---

## B. Current Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `fd563fd898257d79ac24e617d5b7ce16c2312e9b` |
| origin/main | `fd563fd898257d79ac24e617d5b7ce16c2312e9b` |
| short hash | `fd563fd` |
| latest subject | `feat(validate): warn on invalid download fileUrl format` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `validate:content` | **0 error(s) / 45 warning(s) on 40 post(s)** |

### B.1 已 landed download validation 規則

| 規則 | warning id | severity | 觸發範圍 | 狀態 |
|------|-----------|---------|---------|------|
| D1 | `download-enabled-fileurl-empty` | warning | ready / published（contentKind=download + enabled=true + fileUrl 空 / whitespace） | ✅ landed（am-7） |
| D2 | `download-fileurl-invalid-type` | warning | ready / published（fileUrl 非 undefined 且非 string） | ✅ landed（am-7） |
| D3 | `download-fileurl-invalid-format` | warning | ready / published（fileUrl non-empty trimmed string + 不符 `^https?://`） | ✅ landed（am-13） |

### B.2 尚未實作之 download validation 規則

- **S1 / S2**：noindex 類 SEO consistency warning，尚未實作；本文件即為其形狀裁決。
- **preview-url-risk**：不實作 validator；為未來 docs-only policy（per am-9 §6.5）。
- **F1 / F2 / A1 / A2 / A3**：registry-dependent；blocked by FormConfig / DownloadAsset registry schema 尚未定稿（per am-1 §5 / pm-20 §10）。

---

## C. Problem Statement

### C.1 Download content 之 SEO 行為原則

per CLAUDE.md §13 / pm-12 §4 / pm-16 §4 / `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §4：

- Download content（含未來之 download landing page）原則上應 **noindex**。
- 文章頁仍應 **indexable**，作為 SEO 入口。
- Download landing page 不應被 Google Search 直達，避免使用者跳過文章頁、流失流量與上下文。

### C.2 既有行為層已 cover

per `src/scripts/build-github.js` L290–L308 / `src/scripts/build-sitemap.js` L125–L131：

- `build-github.js` robots meta precedence：
  1. `post.seo.indexing` explicit
  2. `contentKind === 'download'` fallback → `noindex, follow`
  3. default → `index, follow`
- `build-sitemap.js`：`seoIndexing !== 'index' && contentKind === 'download'` → 排除於 sitemap。

→ 行為層級 download content **預設已 noindex** + **自動排除 sitemap**；屬 SEO-1 fallback 已固化。

### C.3 既有 validator 已 cover

per `src/scripts/validate-content.js` 既有規則：

- `invalid-seo-block`：`post.seo` 存在但非 plain object → warning。
- `invalid-seo-indexing`：`post.seo.indexing` 存在但非 string / 不在 `VALID_SEO_INDEXING = { 'index', 'noindex-follow', 'noindex-nofollow' }` → warning。

→ 對於 frontmatter `seo` 區塊**型別 / 列舉值**已有 warning 把關；但對於「download content 之 `seo.indexing` **未顯式設**」或「download content 之 `seo.indexing` **顯式設 index**」**無**警示。

### C.4 待裁決問題

> 是否要求作者在 download content 之 frontmatter **顯式宣告** `seo.indexing`？若是，應採何種 rule 形狀？

可能形狀：

1. **S1 + S2 分拆**：missing case 與 explicit-index case 各自獨立 rule。
2. **S1 ∪ S2 合併**：一條 rule 涵蓋兩種情境。
3. **暫不實作 validator**：依賴行為層 fallback，不在 frontmatter 層發 warning。

本文件即裁決此題。

---

## D. Candidate Options

### D.1 Option Alpha — Split S1 and S2（拆分）

| 項目 | 內容 |
|------|------|
| 規則 1（S1） | `download-content-should-be-noindex` |
| S1 觸發條件 | `contentKind === 'download'` 且 `seo.indexing === undefined` |
| 規則 2（S2） | `download-content-marked-index` |
| S2 觸發條件 | `contentKind === 'download'` 且 `seo.indexing === 'index'` |
| 觸發範圍 | ready / published only（mirror 既有 SEO-related warning pattern） |
| 與既有 `invalid-seo-block` / `invalid-seo-indexing` 之互斥 | 既有規則優先；若已觸發則 S1 / S2 不再 push |
| fixture 需求 | 2 個 negative：`_test-download-content-no-seo-indexing.md`（觸發 S1）+ `_test-download-content-marked-index.md`（觸發 S2） |
| 預期 baseline impact（落地後） | +2 → 47 / 42（warnings / posts） |
| message 設計 | 兩條獨立 message，各自針對「missing」「explicit index」之 remediation hint 精細化 |
| 優點 | (1) 語意細：missing 與 explicit index 分開；(2) remediation hint 可各自最佳化；(3) 未來若兩 case 需獨立調整 severity / 觸發範圍，無需重構 |
| 缺點 | (1) 規則數較多（一個面向兩條 warning id）；(2) fixture 較多；(3) 作者讀 warning 列表時可能困惑「這兩條是同一面向還是不同面向」；(4) 重構成本（若未來合併要 deprecate 一條 id） |

### D.2 Option Beta — Merge S1 / S2 into one warning（合併；**推薦**）

| 項目 | 內容 |
|------|------|
| 規則 | `download-content-should-be-noindex` |
| 觸發條件 | `contentKind === 'download'` 且 (`seo.indexing === undefined` 或 `seo.indexing === 'index'`) |
| 觸發範圍 | ready / published only |
| 與既有 `invalid-seo-block` / `invalid-seo-indexing` 之互斥 | 既有規則優先；若已觸發則 S1 不再 push |
| fixture 需求 | 1 ~ 2 個 negative（fixture 設計屬未來 source phase；本 phase 不裁決 fixture 數） |
| 預期 baseline impact（落地後） | 若 1 fixture +1 → 46 / 41；若 2 fixtures +2 → 47 / 42 |
| message 設計 | 單一 warning id；`value` 動態根據實際 `seo.indexing` 值（`(missing)` vs `"index"`）攜帶差異化資訊 |
| 優點 | (1) 規則數少：作者讀 warning 列表時面向單一明確；(2) 與「download content 該 noindex」之單一語意命題對齊；(3) 與既有 cadence（一條 rule 涵蓋多個 trigger value，如 `book-mediatype-invalid`）一致；(4) deprecate 風險低 |
| 缺點 | (1) message 需動態組合；(2) 若未來需對 missing vs explicit-index 採不同 severity，需拆 rule（屬未來 phase）；(3) 規則名稱 `download-content-should-be-noindex` 略偏「prescriptive」風格，但既有 rule 如 `body-leading-h1` / `missing-description` 亦同風格，不違 cadence |

### D.3 Option Gamma — Docs-only policy, no validator yet（暫不實作）

| 項目 | 內容 |
|------|------|
| 規則 | 無新 validator |
| 機制 | 把「download content 應 noindex」原則寫進 docs / template；行為層 fallback 保持不變 |
| fixture 需求 | 0 |
| 預期 baseline impact | 0（baseline 完全不變） |
| 優點 | (1) baseline 零 drift；(2) 不需設計 fixture；(3) 不需 review source change；(4) 與既有 docs-only policy cadence（如 preview-url-risk）一致 |
| 缺點 | (1) 未來 production content 若誤設 `seo.indexing: index` 不會被 validator 接住；(2) 依賴 reviewer 手動 catch；(3) 與 D1 / D2 / D3 之保守先行 cadence 不一致（其他都做了 validator，唯獨 S 系列退回 docs-only 會破壞系列一致性）；(4) 若未來改實作，仍需走 docs-only 裁決 → source 之兩 phase，總成本不低 |

---

## E. Comparison Table

| 維度 | Option Alpha（拆分） | Option Beta（合併）**推薦** | Option Gamma（docs-only） |
|------|-------------------|---------------------------|--------------------------|
| rule count（新增） | 2 | 1 | 0 |
| fixture count（新增） | 2 | 1 ~ 2 | 0 |
| expected validate baseline change（if implemented later） | +2 warnings / +2 posts → 47 / 42 | +1 warnings / +1 posts → 46 / 41（若 1 fixture）；或 +2 → 47 / 42（若 2 fixtures） | 0 → 45 / 40（不變） |
| production content risk（catching real misconfigurations） | 🟢 高 | 🟢 高（覆蓋面與 Alpha 相同） | 🔴 低（無 validator） |
| user comprehension（warning 列表上之可讀性） | 🟡 中（兩條 id 屬同一面向，可能困惑） | 🟢 高（單一 id，語意單一） | 🟢 高（無新 warning） |
| source complexity | 🟡 中（兩個 if 分支） | 🟢 低（單一 if 分支 + 動態 value 字串） | 🟢 零 |
| 與既有 cadence 一致性 | 🟡 中（多數既有 SEO 類 warning 為單條） | 🟢 高（mirror `book-mediatype-invalid` / `invalid-publish-target-mode` 之單 rule 涵蓋多 trigger value） | 🔴 低（破壞 D1 / D2 / D3 保守先行 cadence） |
| 是否 block landing page / registry work | ❌ 不 block（兩者皆與 landing page renderer / FormConfig / DownloadAsset registry 解耦） | ❌ 不 block | ❌ 不 block |
| message remediation hint 精細度 | 🟢 高（兩條各自最佳化） | 🟡 中（單條 + 動態 value；可在 message 內 describe 兩種情境） | n/a |
| 未來 deprecate / 重構成本 | 🟡 中（若合併要 deprecate 一條 id） | 🟢 低（單條 id 可直接擴張 trigger condition） | 🟡 中（若改實作仍需走 docs-only → source） |
| recommendation | ❌ not recommended | ✅ **recommended** | ❌ not recommended |

---

## F. Decision

### F.1 採用 Option Beta（合併）

- **未來 source phase 之 canonical rule id**：`download-content-should-be-noindex`
- **觸發條件**：`contentKind === 'download'` 且 (`seo.indexing === undefined` 或 `seo.indexing === 'index'`)
- **觸發範圍**：ready / published only
- **severity**：warning（first pass；不直接 error，mirror D1 / D2 / D3 保守 cadence）
- **與既有規則之互斥**：既有 `invalid-seo-block` / `invalid-seo-indexing` 優先；若已觸發則本規則不再 push（mirror am-5 §7.2 pseudo 已標明之 cascade 策略）
- **S2 命名處置**：`download-content-marked-index` **不再**作為獨立 rule id 實作；保留為 **historical candidate name** / **deprecated candidate**，記錄於本 doc 與 am-9 §7 / am-9 §9.4，不進 validator source。
- **本 phase 不改 source / fixture / baseline**：以上裁決僅為未來 source phase 之輸入；本 phase 不啟動 implementation。

### F.2 推薦理由（按 evidence 強度排序）

1. **語意單一性**：「download content 應 noindex」為單一原則命題；missing 與 explicit index 為同一原則之兩種違反形式；合併符合「一條 rule = 一個違反命題」之 cadence。
2. **既有 cadence 對齊**：既有 `book-mediatype-invalid` / `invalid-publish-target-mode` / `invalid-canonical` 等規則皆「單一 rule id 涵蓋多種 trigger value 並以 `value` 字串攜帶差異」；本裁決與既有 pattern 一致。
3. **作者讀 warning 列表之單純化**：合併後作者讀 validator 輸出時，每篇 download post 對 noindex 面向至多 1 條 warning；不會出現「S1 + S2 同時觸發」之語意混亂（注：實際上 S1 missing 與 S2 index 互斥，不會同時觸發；但作者讀 rule list 時仍會困惑「兩條規則差在哪」）。
4. **deprecate 風險低**：若未來合併規則需要「missing 與 index 採不同 severity」之需求出現，從合併 → 拆分屬擴張式 refactor（新增第二條 id；原 id 可保留或 deprecate）；反向（拆分 → 合併）需 deprecate 一條 id，rollout 較複雜。
5. **baseline 變動小**：合併版可選 1 fixture（覆蓋 missing case；index case 為衍生 case，可由同 fixture 之變體 OR 另開 fixture 在後續 phase 補）；最小可控變動為 +1 warning / +1 post → 46 / 41。

### F.3 與既有 am-9 §14.1 conditional 建議之關係

- am-9 §14.1 已 conditional 推薦「S1 / S2 建議合併（option β）」；本 phase 將該 conditional 升級為 **unconditional 裁決**。
- 本 phase 不改 am-9 其他 §；am-9 之 D3 / preview-url-risk / S1 / S2 之 §5 / §6 / §7 / §8 / §11 段保持 frozen。

### F.4 與 am-11 / am-13 之關係

- am-11（relative path decision）：已 landed；屬 D3 範疇；與本 phase S1 / S2 解耦。
- am-13（D3 source）：已 landed（commit `fd563fd`）；屬 D3 範疇；與本 phase S1 / S2 解耦。
- 本 phase 不影響 am-11 / am-13；am-11 / am-13 亦不影響本 phase。

---

## G. Future Implementation Gate

若未來要進入 S1 source phase（落實本 phase 裁決之 Option Beta），必須**全部滿足**以下條件：

- [ ] baseline clean（HEAD = origin/main；ahead / behind 0 / 0；working tree clean）。
- [ ] 本 docs decision 已 landed 於 origin/main。
- [ ] 該 phase 為**獨立 phase + user explicit approval**。
- [ ] 該 phase **只**修改 `src/scripts/validate-content.js` + 新增 validation fixtures；不碰其他檔。
- [ ] **不**碰 landing page renderer / `formRef` / `assetRefs[]` / FormConfig / DownloadAsset registry / Google Form / template / settings。
- [ ] 預估 validate baseline 變動先在 commit message / docs preanalysis 寫清楚（+1 或 +2 warnings；對應 fixture 數）。
- [ ] implementation 完成後須有 read-only acceptance cross-check phase（mirror am-7 → am-8 / am-13 → am-14 cadence），確認：
  - `validate:content` 實際 baseline 與預期相符。
  - 既有 D1 / D2 / D3 fixture **不**被 S1 額外觸發（D1 fixture 之 `contentKind=download` 但 `seo` block 結構需確認 → 若 D1 fixture 未設 `seo.indexing`，可能會新觸發 S1；屬未來 source phase 須 audit 之 baseline math，本 doc 僅 flag）。
  - 既有 production content 中 download fixture（`content/blogger/posts/20260529-phonics-practice-sheet-download.md`，status=draft）不受影響（draft 由 loadPosts 過濾，不進 ready/published-only validation）。
  - 既有 build-github / build-sitemap fallback 行為未變。
- [ ] 不在同一 phase 同時啟動其他新規則（避免 baseline 變動原因混淆）。

任一 unmet → S1 source phase **不**啟動。

### G.1 預期 baseline 變動之 audit note

> 重要：未來 source phase 落地前，須先 read-only 預估「既有 D1 / D2 / D3 fixture 是否會新觸發 S1」。

- `_test-download-enabled-fileurl-empty.md`（D1 fixture）：`contentKind: "download"`，status=ready；若**未**設 `seo.indexing` → 落地 S1 後**會新觸發 S1**；屬預期 baseline +1（非 regression，屬 design intent）。
- `_test-download-fileurl-invalid-type.md`（D2 fixture）：同上 audit。
- `_test-download-fileurl-invalid-format.md`（D3 fixture）：同上 audit。
- 即：若三個既有 download fixture 之 `seo.indexing` 皆未設，**S1 落地後 baseline 變動可能為 +3 ~ +4**（3 個既有 fixture 各 +1，加上 1 個新 S1-specific fixture +1；扣除新 S1 fixture 同時是 D1 / D2 / D3 之 case 後）。
- 真實 audit 須在未來 source phase 之 preanalysis 階段 read fixture 後計算；本 phase **不**做此 audit（屬未來 phase 之 scope，本 phase 為形狀裁決）。
- 若 baseline 變動超出預期，未來 source phase 可選擇：
  1. 在既有 D1 / D2 / D3 fixture 之 frontmatter 補 `seo.indexing: noindex-follow` 以避開 S1（屬 fixture maintenance，可接受）；或
  2. 接受 baseline 多 +N 變動，並在 commit message 明示「既有 fixture 同時觸發 S1 為 design intent」。
- 本 doc **不**裁決上述兩選項；屬未來 source phase 之 implementation decision。

---

## H. Explicit Non-goals

本 phase 明確**不做**：

- no source implementation
- no `src/scripts/validate-content.js` change
- no fixture creation
- no content publish / no draft-to-ready
- no `download.fileUrl` fill
- no settings change（不改 `content/settings/`）
- no templates change
- no package change
- no build / no deploy
- no `npm run build:*`
- no Blogger repost
- no GA4 validation
- no reverse UTM activation
- no pm-26 deploy gate unblock
- no Admin Apply enable
- no middleware write route enable
- no `admin-write-cli` dry-run / apply
- no form registry creation（FormConfig schema 未動）
- no asset registry creation（DownloadAsset schema 未動）
- no Google Form respondent data import / handling
- no download landing page renderer source / template
- no `npm install`
- no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`
- no am-7 / am-9 / am-11 / am-13 docs 變更
- no am-7 D1 / D2 implementation 變更
- no am-13 D3 implementation 變更

### H.1 Governance frozen state

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守：本 phase 不引入任何 respondent data 通路、不把 `download.fileUrl` 與 Google Form URL 混為一談、不另造 SEO pipeline。
- am-7 D1 / D2 + am-13 D3 implementation 保持 frozen；本 phase 不重做、不調整、不退化。

---

## I. Docs Consistency Check

本 docs 與既有狀態之一致性：

- ❌ 本 doc **不**宣稱 S1 / S2 已 landed。
- ❌ 本 doc **不**宣稱 validate baseline 已變更（仍為 0 errors / 45 warnings / 40 posts）。
- ❌ 本 doc **不**宣稱 production behavior 已改變（行為層 fallback 與 robots meta 與 sitemap 邏輯不變）。
- ❌ 本 doc **不**宣稱 reverse UTM gate 已解鎖。
- ❌ 本 doc **不**宣稱 Blogger / GitHub Pages 已 deploy。
- ❌ 本 doc **不**改 am-9 之 S1 / S2 命名（保留 am-9 §7 / §9.3 / §9.4 之命名草案；本 doc 採 am-9 §9.3 之 `download-content-should-be-noindex` 為 canonical id；S2 之 `download-content-marked-index` 保留為 deprecated candidate name）。
- ❌ 本 doc **不**改 am-11 之 D3 relative path 裁決。
- ❌ 本 doc **不**改 am-13 之 D3 source implementation。

---

## J. Recommended Next Step

完成本 phase（新增單一 docs 檔 + commit + push + final verify）後，**建議 Final Idle Freeze / EXIT**。

不要本 session 直接開始 S1 source implementation。

若 user 明確要求繼續，可選之安全階段為（依保守度排序，皆 docs-only / read-only；任一啟動需 user explicit approval）：

| 序 | 候選 phase | 性質 |
|---|-----------|------|
| 1 | `download-validation-s1-s2-merge-decision-acceptance-read-only`（本 doc 之 read-only acceptance cross-check） | read-only |
| 2 | `download-validation-s1-source-implementation-preanalysis`（針對 Option Beta 實作前之 read-only 預估 baseline 變動 + fixture 設計） | docs-only / read-only |
| 3 | `download-fileurl-preview-url-risk-docs-policy`（per am-9 §14.1；docs-only policy，不實作 validator） | docs-only |

**不**建議直接推薦 S1 source implementation；亦**不**建議在 read-only acceptance cross-check 前直接跳 source phase。

---

（本文件結束）
