# downloadFunnel validator series (F2–F8) — closeout summary

- Phase id：`20260625-download-funnel-validator-series-closeout-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only closeout summary**（整理 F2–F8 已落地內容、baseline、deferred、後續建議；**無** source implementation）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）
- 允許範圍：**只**新增本 docs summary；不改 src / scripts / content / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。

---

## 1. Current frozen baseline

| 項目 | 值 |
| --- | --- |
| baseline | `66eb352` |
| latest subject | `docs(state): sync funnel bidirectional baseline` |
| HEAD == origin/main | ✅（ahead/behind 0/0） |
| working tree | clean |
| `.git/index.lock` | absent |

current validation baseline（本 phase 量測）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js`（單篇 metadata） | 103 passed / 0 failed |
| `node src/scripts/check-validation-report.js`（corpus / report） | 22 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay（`validate-content.js --registry-overlay …commerce-c4-c9-overlay.json`） | 0 / 140 / 106 |
| production `downloadFunnel` 觸發數 | **0** |

---

## 2. F2–F8 timeline

> 每個 source slice 之 feat commit 一律改 `src/scripts/validate-content.js`（+ slice 10 另改 `report-validation.js` / `check-validation-report.js`）；slice 1–8 改 `src/scripts/check-page-type-validator.js`（單篇 harness）；slice 10 改 corpus/report harness（單篇 harness 不動）。每個 feat 後均有一支 `docs(state): sync …` baseline-sync commit。

| 階段 | slice | commit | subject | changed files | 主要 warning code | 驗證摘要 |
| --- | --- | --- | --- | --- | --- | --- |
| **F2** | slice 1 | `b9556be` | feat: add gated funnel metadata schema validator (slice 1) | validate-content.js / check-page-type-validator.js / slice1 doc | structural / enum / suspicious-field（4） | harness 45→56；0/133/105 |
| **F3** | slice 2 | `069df43` | feat: validate gated funnel required metadata combos | validate-content.js / check-page-type-validator.js / slice2 doc | required-combo（8） | harness 56→71；0/133/105 |
| **F4** | slice 3（preflight） | `9d3e034` | docs: preflight next funnel metadata validator slice | slice3 doc | —（盤點 §5.4 role↔policy） | docs-only；0/133/105 |
| **F5** | slice 4 | `480f66c` | feat: validate funnel role policy consistency | validate-content.js / check-page-type-validator.js / slice4 doc | role↔policy（3） | harness 71→82；0/133/105 |
| **F6** | slice 5（preflight） | `69001d3` | docs: preflight funnel robots-safety validator slice | slice5 doc | —（盤點 robots-safety；重用 `resolvePostDetailRobots`） | docs-only；0/133/105 |
| **F6** | slice 6 | `1ddfa3c` | feat: validate funnel robots safety | validate-content.js / check-page-type-validator.js / slice6 doc | robots-safety（1） | harness 82→89；0/133/105 |
| **F7** | slice 7（preflight） | `a44127e` | docs: preflight funnel secret heuristic validator | slice7 doc | —（盤點 §5.3 value heuristic） | docs-only；0/133/105 |
| **F7** | slice 8 | `e6177c1` | feat: validate funnel private values | validate-content.js / check-page-type-validator.js / slice8 doc | private-value（2） | harness 89→103；0/133/105 |
| **F8** | slice 9（preflight） | `3d36350` | docs: preflight funnel bidirectional validator | slice9 doc | —（盤點 bidirectional；架構選 corpus pass） | docs-only；0/133/105 |
| **F8** | slice 10 | `38dccf0` | feat: validate funnel bidirectional links | validate-content.js / report-validation.js / check-validation-report.js / slice10 doc | bidirectional（2） | 單篇 harness 103/0 不變、corpus/report 14→22；0/133/105 |

baseline-sync commits（docs-only，§3a snapshot）：`755d195`（slice 1）/ `1058709`（slice 4）/ `caf880e`（slice 6）/ `e25d733`（slice 8）/ `66eb352`（slice 10）。

---

## 3. Final warning-code inventory（20 codes）

> 共同性質：**全部 warning-only / additive / 0 production trigger**；除少數 enum-echo（pageType / robots enum 字串）外，**凡涉及 targetGatedPage / entryPages 之 value 一律 no-value-echo**。

### 3.1 structure / enum / suspicious key（slice 1；單篇）

| code | purpose | scope | production impact | no-value-echo |
| --- | --- | --- | --- | --- |
| `downloadFunnel-invalid-type` | downloadFunnel 非 plain object | 單篇 | 0 | n/a（只報 typeof） |
| `downloadFunnel-role-missing` | downloadFunnel 存在但 role 缺省 | 單篇 | 0 | 無 value |
| `downloadFunnel-role-invalid-enum` | role 非 entry/gated_page | 單篇 | 0 | echo role enum（非敏感） |
| `downloadFunnel-suspicious-field` | 未授權 key（含 secret-like key 名） | 單篇 | 0 | ✅ 只報 key 名、不 echo value |

### 3.2 required-combo（slice 2；單篇）

| code | purpose | scope | production impact | no-value-echo |
| --- | --- | --- | --- | --- |
| `downloadFunnel-entry-missing-target-gated-page` | role=entry 缺 targetGatedPage | 單篇 | 0 | 無 value |
| `downloadFunnel-gated-page-missing-entry-pages` | role=gated_page 缺/空 entryPages | 單篇 | 0 | 無 value |
| `downloadFunnel-target-gated-page-wrong-role` | gated_page 卻有 targetGatedPage | 單篇 | 0 | 無 value |
| `downloadFunnel-entry-pages-wrong-role` | entry 卻有 entryPages | 單篇 | 0 | 無 value |
| `downloadFunnel-target-gated-page-invalid-type` | targetGatedPage 非 string | 單篇 | 0 | ✅ 只報 typeof |
| `downloadFunnel-entry-pages-invalid-type` | entryPages 非 array / 含非 string | 單篇 | 0 | ✅ 只報 typeof / index |
| `downloadFunnel-entry-pages-too-many` | entryPages > 10 | 單篇 | 0 | ✅ 只報 count |
| `downloadFunnel-entry-pages-duplicate` | entryPages 含重複 | 單篇 | 0 | ✅ 只報重複數量 |

### 3.3 role↔policy single-page（slice 4；單篇）

| code | purpose | scope | production impact | no-value-echo |
| --- | --- | --- | --- | --- |
| `downloadFunnel-role-conflicts-sitemap-safety` | gated_page + includeInSitemap / platformPolicy.github.includeInSitemap true | 單篇 | 0 | 無 value |
| `downloadFunnel-role-conflicts-listings-default` | gated_page + includeInListings true | 單篇 | 0 | 無 value |
| `downloadFunnel-gated-page-pageType-mismatch` | gated_page + pageType ∉ {gated_download, download} | 單篇 | 0 | 無 value（不 echo pageType） |

### 3.4 robots-safety（slice 6；單篇，重用 `resolvePostDetailRobots`）

| code | purpose | scope | production impact | no-value-echo |
| --- | --- | --- | --- | --- |
| `downloadFunnel-role-conflicts-robots-safety` | gated_page 但 effective GitHub robots = `index, follow` | 單篇（讀 corpus-free effective robots） | 0 | 無 value（只含 robots enum） |

### 3.5 private-value heuristic（slice 8；單篇，`looksLikePrivateFunnelLink`）

| code | purpose | scope | production impact | no-value-echo |
| --- | --- | --- | --- | --- |
| `downloadFunnel-target-gated-page-private-value` | targetGatedPage 命中 Drive/Form/token query | 單篇 | 0 | ✅ **MUST 不 echo value** |
| `downloadFunnel-entry-pages-private-value` | entryPages 任一命中 Drive/Form/token query | 單篇 | 0 | ✅ **MUST 不 echo value** |

### 3.6 bidirectional cross-file（slice 10；corpus pass）

| code | purpose | scope | production impact | no-value-echo |
| --- | --- | --- | --- | --- |
| `downloadFunnel-entry-page-not-listed-by-gated-page` | entry→gated 存在但 gated 未列回 entry（掛 entry） | corpus（cross-file） | 0 | ✅ 只用 own-slug + sourcePath |
| `downloadFunnel-gated-page-not-targeted-by-entry` | gated 列 entry 但 entry 未指回（掛 gated） | corpus（cross-file） | 0 | ✅ 只用 own-slug + sourcePath |

---

## 4. Architecture（驗證分層）

- **單篇 metadata checks（F2–F7）**：`validate-content.js` 之 `validatePageTypeMetadata(post, …)`（每次只看一篇）；涵蓋 structure / enum / suspicious / required-combo / role↔policy / robots-safety / private-value。robots-safety 重用純函式 `resolvePostDetailRobots`（effective robots 與 build 對齊，但仍屬單篇計算）。
- **corpus cross-post pass（F8 bidirectional）**：`validate-content.js` 之 `validateContent({posts, settings})` 末段（mirror `duplicate-slug` / `series-number-duplicate`）；建 `funnelPostBySlug` Map → 兩方向 reciprocity → 每篇各 push、`sourcePath` 指該檔。**不**放單篇 validator（後者無 corpus context）。
- **report bucketing**：`report-validation.js` 之 `CROSS_POST_TYPES` 納入 2 bidirectional code → 進 `buckets.crossPost` 聚合視圖；`classifyRuleClass` 之 frontmatter regex 含 `downloadFunnel-`（避免落入 `unknown` class）。
- **harness baselines**：單篇 `check-page-type-validator.js` = **103 / 0**；corpus/report `check-validation-report.js` = **22 / 0**。

---

## 5. Safety guarantees（全 series 恆守）

- ✅ **warning-only**：20 codes 全 severity `'warning'`；無 error / hard gate。
- ✅ **0 production downloadFunnel trigger**：無 production post 含 `downloadFunnel` → validate:content / report:validation / overlay 自始至終 0/133/105 · 0/133/105 · 0/140/106。
- ✅ **no indexing decision change**：validator 只**讀**（含 robots-safety 只讀 `resolvePostDetailRobots` 結果）；不改 `page-type-robots.js` / `include-in-sitemap.js` / `include-in-listings.js` / build。
- ✅ **no noindex / sitemap / listings / robots safety loosening**：funnel 為純 metadata（§4.7 最低層）；role↔policy / robots-safety 規則方向為**告警鬆動企圖**（強化 safety）。
- ✅ **no value echo**：凡 targetGatedPage / entryPages 之 value 一律不 echo（private-value / bidirectional MUST）；message 只用 field name / typeof / index / count / enum / own-slug / sourcePath。
- ✅ **no real Drive / Form / URL / token / respondent data**：所有 harness / doc sample 為 placeholder（`example.com` / `drive.example.com` / `forms.example.com` / `FAKE-*` / `entry-e` / `gated-x`）。
- ✅ **no live service access**：未讀 Blogger / Form / Drive / GA4 backend。
- ✅ **no build / deploy / repost**。

---

## 6. Deferred items（建議順序 + 屬性）

> 標示：risk level / suggested phase type / 是否應先於 production content migration。

| # | 項目 | risk | suggested phase type | before content migration? |
| --- | --- | --- | --- | --- |
| 1 | **.md fixture preflight + fixture landing** | 🟢 low | preflight only → fixture only | **YES**（先建 fixture 給 funnel 規則 regression 覆蓋，再談 production 內容） |
| 2 | dangling / missing-post warning | 🟡 medium（新增 warning） | preflight only → source landing | 建議 YES（讓 migration 內容受 dangling 檢查）；可在 fixture 之後 |
| 3 | `.html` / last-segment normalization | 🟡 low-medium | source landing（小） | optional（利於 Blogger `.html` ref 匹配） |
| 4 | absolute URL matching | 🟠 medium-high（需 host 邏輯） | preflight only → source landing | NO（與 host-mismatch 綁定） |
| 5 | host-mismatch 判定 | 🔴 high（需 site URL 設定 / 跨 host） | preflight only | NO |
| 6 | bare opaque ID heuristic | 🟡 medium（false-positive 重） | preflight only | NO |
| 7 | ctaEventName / GA4 normalization | 🟡 medium（GA4 耦合） | preflight only → source landing（綁 GA4 normalization phase） | NO（獨立線） |
| 8 | production content migration（真實 gated/entry `.md`） | 🟠 medium-high（真實內容 + secret 紀律） | source landing（content） | —（本身即 migration；應在 fixture 之後） |
| 9 | live funnel / Form / Drive / GA4 backend | 🔴 high（CLAUDE.md §29 第一版永禁） | integration（非 v1） | NO |
| 10 | Admin write path | 🔴 high（dormant） | governance + source | NO |
| 11 | generated HTML / deployed robots verification | 🟡 medium | manual verification（build + inspect） | NO（待內容存在後） |
| 12 | Blogger robots dimension | 🟡 medium（後台手動 NO INDEX；無法系統推導） | manual verification（SP-9c） | NO |

---

## 7. Recommended next step（保守建議）

**建議下一個 phase = `.md` fixture preflight only**（同意 Dean 偏好）。理由：

1. **validator 主線（F2–F8，20 codes）已完整落地**且 0 production trigger；下一個增量價值不在「再加規則」，而在「給既有規則建立 fixture-based regression 覆蓋」。
2. **至今全 series 採 harness-only（in-memory）**，repo 內**無任何** `downloadFunnel` `.md` fixture；production 端從未以真實 `.md` 走過 funnel 規則。先建 fixture 可在**不引入 production 內容**下，鎖住 20 codes 的真實 frontmatter 行為，並為未來 production migration 提供安全網。
3. **fixture 先於 production content migration**：直接做 production 內容會同時引入「內容正確性」與「規則是否如預期」兩個變數；先 fixture 把規則行為釘死，migration 才單純。
4. fixture preflight = 🟢 low risk、docs-only，符合保守路線。

**關於 dangling / missing-post 是否更優先**：**不建議更優先**。理由：(a) 它會**新增 warning**（行為變動，risk 高於 fixture）；(b) dangling 的測試本身需要 corpus fixture 基礎，**先有 fixture 設計再做 dangling 更穩**；(c) 它屬「擴充覆蓋面」而非「鎖住既有」，順序上應在 fixture 之後。故 dangling/missing-post 列為 fixture 之後的**第二順位 source 候選**。

**本 Session 不實作**任何項目；以上僅建議，待 Dean explicit approval 才啟動。

---

## 8. Cross-links

- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 schema preflight；§5 validator candidate 總表）
- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
- landing records：`…slice{1,2,4,6,8,10}-*.md`；preflight：`…slice{3,5,7,9}-*.md`
- `src/scripts/validate-content.js`（`validatePageTypeMetadata` 單篇 + `validateContent` corpus pass）
- `src/scripts/report-validation.js`（`CROSS_POST_TYPES`）
- `CLAUDE.md` §3a（frozen baseline + validation baseline 表）/ §7 / §13 / §16 / §29

（本文件結束）
