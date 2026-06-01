# 2026-06-01 Project-Wide Status Checkpoint

> Phase: `20260601-pm-3-project-wide-status-checkpoint-docs-only-a`
> Date: 2026-06-01 14:44 +0800
> Scope: **docs-only**（單檔新增；無 `src/` / `content/` / `content/settings/` / `content/templates/` / `content/validation-fixtures/` / `package` / `package-lock` / `dist` / `gh-pages` / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `550865a85ca00b43df929a270959373ceba75e0f`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**
> Frozen baseline subject: `docs(download): plan workflow next steps`

---

## 1. Executive Summary

- 本文件為 **pm-2 project-wide next-work triage（read-only PASS）之後**的 project-wide status checkpoint：彙整目前 sourceKey / RelatedLinks、download workflow、reverse UTM / pm-26、Admin write infra 之 **frozen state** 與**下一步候選**。
- 記錄目前 repo **frozen at `550865a`**（HEAD = origin/main；ahead/behind = 0/0；working tree clean；validate `0 / 47 / 42`）。
- 本文件**不授權任何 source implementation、write path、deploy、Blogger repost、GA4 validation 或 activation**。唯一變更為新增本 docs 檔；commit + push 後預期 production state drift = 0，validate baseline 維持 `0 / 47 / 42` 不變。
- **預設建議：本 checkpoint commit + push 後 Final Idle Freeze / EXIT；不自動啟動下一 phase。**

### 1.1 一句話裁決

> **完成本 checkpoint commit + push 後 Final Idle Freeze / EXIT；任何 source implementation / write / deploy / activation 都需要獨立明示 phase；下次 cold-start 必須先 baseline verify。若要推進 download，下一個最保守步驟是 loader implementation preanalysis（docs-only），不是直接 source implementation。**

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| repo path | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `550865a85ca00b43df929a270959373ceba75e0f` |
| origin/main（本 phase 啟動時） | `550865a85ca00b43df929a270959373ceba75e0f` |
| short | `550865a` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(download): plan workflow next steps` |

State 確認：

- ✅ pm-2 project-wide next-work triage **read-only PASS**。
- ✅ sourceKey track 已收束至 **Admin read-only selector preview + source-inactive validator preanalysis**。
- ❄ download workflow 已完成 docs planning，但 loader / validator / Admin picker / renderer / migration 仍 **dormant**。
- ❄ reverse UTM **landed but dormant**；pm-26 deploy gate **BLOCKED**；Admin write infra **dormant**。

---

## 3. SourceKey / RelatedLinks Status

下列 sourceKey / RelatedLinks track 項目皆已落地並驗收（read-only / additive；不破壞既有 baseline）：

| 項目 | 狀態 | 位置 / 備註 |
|---|---|---|
| **link-sources registry landed，8 sources 全 active** | ✅ landed | `content/settings/link-sources.json`（`version: 1`；`sources[]` 共 8 筆；全 `isActive: true`；`sortOrder` 10–80） |
| **sourceKey templates landed** | ✅ landed | relatedLinks / otherLinks 條目支援 `sourceKey` 欄位（per `docs/related-links-schema.md`） |
| **renderer fallback landed** | ✅ landed | post-detail / blogger-post-full renderer 讀 `sourceKey` 並 fallback；既有顯示行為不退化 |
| **GA4 `link_source_key` landed** | ✅ landed | sourceKey → GA4 `link_source_key` data attribute |
| **`source-key-not-found` landed** | ✅ landed | `src/scripts/validate-content.js`：non-empty string 但不在 `activeSourceKeys`（另有 `-invalid-type` / `-empty` 兩條互斥前置規則） |
| **Admin read-only selector preview landed and accepted** | ✅ landed + 驗收（am-4 PASS） | `src/scripts/active-source-keys.js` + `src/scripts/load-admin-posts.js` + `src/views/admin/index.ejs`（disabled `<select>`；`aria-disabled="true"`；視覺 warning only） |
| **source-inactive validator preanalysis landed** | ✅ docs-only landed | `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`（proposed rule id `related-links-source-key-inactive`；docs-only；未實作） |

未完成（dormant / not-started；本 checkpoint **不授權 implementation**）：

- ❄ **source-inactive validator implementation**（rule logic 本身未實作；8 sources 全 active 使其無觸發案例）。
- ❄ **sourceKey content migration**（不寫回 `.md` frontmatter）。
- ❄ **Admin write path**（無 Apply / 無 form submit / 無 middleware write route / 無 safeWrite production caller）。

備註：8 active sources 為 `blogger` / `github` / `bagel-books` / `life` / `tech-note` / `youtube` / `netflix` / `taipei-library`；當前全 active，因此 inactive 目前由既有 `not-found` 視角捕捉，無獨立 inactive 訊號。

---

## 4. Download Workflow Status

| 項目 | 狀態 |
|---|---|
| **download-assets.json / download-forms.json empty registries landed** | ✅ landed（`466e471`）；shape = `{ schemaVersion: 1, updatedAt: "", assets\|forms: [], notes: "" }`（read-only inspection 確認兩檔皆為 empty） |
| **loader preanalysis landed** | ✅ docs-only（`docs/20260601-download-loader-preanalysis.md`；loader contract + registry lookup model + legacy `download.fileUrl` grandfather） |
| **remaining validation rules preanalysis landed** | ✅ docs-only（`docs/20260601-download-validation-remaining-rules-preanalysis.md`；D / S / F / A family-level + fixture inventory + sequencing） |
| **workflow next-step preanalysis landed** | ✅ docs-only（`docs/20260601-download-workflow-next-step-preanalysis.md`；next-step 優先序裁決） |
| **fileUrl relative-path policy（Option D）** | ✅ docs decision（`docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md`） |
| **preview URL risk policy** | ✅ docs decision（`docs/20260530-download-fileurl-preview-url-risk-policy.md`；authoring policy；validator 不對 raw URL 做 regex / reachability） |
| **S1/S2 merge decision（Option Beta）** | ✅ docs decision（`docs/20260530-download-validation-s1-s2-merge-decision.md`；單一 rule id `download-content-should-be-noindex`） |

未完成（dormant；本 checkpoint **不授權 implementation**）：

- ❄ **source implementation**（`src/scripts/load-settings.js` 未串接 download registry；read-only inspection 確認無 download refs）。
- ❄ **validator via registry**（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry 全未實作）。
- ❄ **Admin picker**（未實作）。
- ❄ **renderer / landing page**（landing page renderer 未實作）。
- ❄ **content migration**（既有 `download.fileUrl` 文章——目前僅 `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 一篇——未遷移至 `assetRefs[]` / `formRef`）。
- ❄ **fixture creation**（無 download 相關 validation fixture）。

R1 紅線重申（per `CLAUDE.md` §3.2 + registry schema decision §8）：respondent data **永不**進 repo / Admin static files（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows / access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID）；Google Forms responses remain in Google Forms / Sheets。empty registry 為 R1 之最強防護狀態。

---

## 5. Reverse UTM / pm-26 Status

| 項目 | 狀態 |
|---|---|
| **Reverse UTM source landed but dormant** | ✅ source landed origin/main（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`；2026-05-23）；❄ live = dormant |
| **no deploy** | ❄ 未 deploy；未碰 gh-pages |
| **no Blogger repost** | ❄ Blogger 後台未重貼 |
| **no GA4 validation** | ❄ GA4 Realtime / DebugView 驗收未啟動 |
| **pm-26 deploy gate remains blocked** | ❄ **BLOCKED** |
| **positive phonics fixture remains draft / not live** | ❄ positive fixture（phonics / GitHub cross-link）仍 `status: draft` / `draft: true`（不出現在 dist / 線上） |

- positive fixture / phonics draft status 仍為 `draft` → **pm-26 gate remains blocked**。
- **本 checkpoint 不解除 gate**；不 deploy / 不 Blogger repost / 不 GA4 validation。
- pm-26 啟動條件詳見 `docs/reverse-utm-fixture-plan.md` §6（fixture 須符合 §3 設計原則與 §4 fixture 類型）。

---

## 6. Admin Write Infra Status

| 項目 | 狀態 |
|---|---|
| **Admin Apply disabled** | ❄ disabled / dormant（FB / SEO 之 `.apply-disabled` 永遠 disabled；無 click handler） |
| **middleware write route absent** | ❄ absent（無 server-side write handler；無 `fs.writeFile` 路徑；read-only inspection 確認 admin/index.ejs 無 write path） |
| **admin-write-cli dormant** | ❄ dormant（不執行 dry-run / apply / real write） |
| **safeWrite production caller absent** | ❄ absent（無 atomic write / dry-run / pre-write validate / post-write validate 之實際執行路徑） |

- 本 checkpoint **不啟用 Apply、不新增 route、不執行 admin-write-cli**。
- sourceKey Admin selector 為純 read-only / disabled preview（`src/views/admin/index.ejs`）；即使有人移除 `disabled`，亦無 fetch / fs / safeWrite caller 可觸發。

---

## 7. Validate Baseline

- **本 phase 為 docs-only，不改 validate baseline**：commit 前後皆預期 **0 errors / 47 warnings / 42 posts**。
- 本 phase 啟動時實測 baseline：`0 errors / 47 warnings / 42 posts`（已確認）。

---

## 8. Next-Work Candidate Ranking

依保守程度排序（最保守在前）；**僅啟動 user 明示之單一 candidate；不擴張 scope；不混合多 candidate**：

| 排序 | 候選 | 性質 | 風險 | 推薦 |
|---|---|---|---|---|
| 1 | **Final Idle Freeze / EXIT** | 不啟動任何 | 🟢 最低 | ⭐ **預設推薦** |
| 2 | download **loader implementation preanalysis（docs-only）** | 新增單一 docs 檔 | 🟢 低 | 僅 user 明示；推進 download 之最保守第一步（仍 docs-only；不寫 code） |
| 3 | download validator remaining-rules **implementation preanalysis（docs-only）** | 新增單一 docs 檔 | 🟢 低 | 僅 user 明示；次於 loader（loader 為更上游依賴根） |
| 4 | **source-inactive validator implementation preanalysis（docs-only）** | 新增單一 docs 檔 | 🟢 低 | 僅 user 明示；non-urgent（8 sources 全 active；無觸發案例） |
| 5 | reverse UTM / pm-26 gate **review（read-only）** | 純 read-only（不改檔） | 🟢 低 | 僅 user 明示；不可立即接 deploy |
| 6 | Admin write infra **review（read-only / docs-only）** | read-only 或單一 docs | 🟢 低 | 僅 user 明示；不啟用 Apply / route / cli |
| — | direct source implementation / deploy / activation | source / build / deploy / activation | 🔴 高 | ❌ **future candidate only；不推薦直接做** |

推薦標示：

- **預設推薦 = Final Idle Freeze / EXIT。**
- 若 user 明示要推進 download，下一個最保守步驟是 **loader implementation preanalysis（docs-only）**，**不是**直接 source implementation。
- **不建議直接 source implementation / validator implementation / deploy / activation**（任何 `src/**` / settings / fixture / build / deploy / Blogger / GA4 / Admin Apply / middleware / admin-write-cli 動作）。

---

## 9. Governance Redlines

本 checkpoint **明確不**授權下列任一動作：

- ❌ **no source change**（任何 `src/**` 變動）
- ❌ **no content / settings / templates / fixtures / package / dist / CLAUDE.md change**（含 registry mutation）
- ❌ **no GA4 validation**
- ❌ **no pm-26 unblock**
- ❌ **no download implementation**（loader / validator / Admin picker / renderer / content migration）
- ❌ **no source-inactive validator implementation**
- ❌ no fixture creation
- ❌ no Admin Apply / no middleware write route / no admin-write-cli dry-run / apply
- ❌ no reverse UTM activation
- ❌ no npm install / build / deploy / Blogger repost
- ❌ no fetch / pull / merge / rebase / reset / stash / amend / force-push

### 9.1 紅線（per `CLAUDE.md` §3.2 + 既有 registry 治理）

- **R1**：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID。
- **R2**：`download.fileUrl` 與 Google Form URL 不可混淆；不主動 migration。
- **R3**：landing page noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline；不變動 SEO pipeline。

---

## 10. Final Recommendation

**Final Idle Freeze / EXIT after this checkpoint commit + push.**

- **不自動啟動下一 phase。**
- **deploy / activation 需要獨立明示 phase。**
- **若要推進 download，下一個最保守步驟是 loader implementation preanalysis（docs-only），不是直接 source implementation。**

理由：

1. pm-2 project-wide next-work triage 已 PASS；sourceKey track 已收束；無 in-flight 待落地之 source / content / settings change。
2. 所有下游方向（download / reverse UTM / Admin write）均為 dormant 或 blocked；無被動到期事項；無時間壓力。
3. **下次 cold-start 必須先 baseline verify**（pwd / branch / HEAD / origin/main / ahead-behind / working tree / `npm run validate:content`），確認仍為本 checkpoint commit 之延伸後再行動。
4. **任何 source implementation / write / deploy / activation 都需要獨立明示 phase**；不可在本 checkpoint 範疇內順手啟動。
5. 對齊 `CLAUDE.md` §1 / §27 / §29 / §30 之「**不過度工程化**」原則。

---

## Cross-references

- `docs/20260601-sourcekey-admin-selector-checkpoint.md`（sourceKey Admin selector frozen state；am-6）
- `docs/20260601-sourcekey-source-inactive-validator-preanalysis.md`（source-inactive validator preanalysis；am-11）
- `docs/20260601-download-workflow-next-step-preanalysis.md`（download workflow next-step 優先序；noon-3）
- `docs/20260601-download-loader-preanalysis.md`（download loader preanalysis；night-5）
- `docs/20260601-download-validation-remaining-rules-preanalysis.md`（download validation remaining rules；night-6）
- `docs/20260601-next-work-roadmap-preanalysis.md`（next-work roadmap；night-3）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 candidate roadmap）
- `docs/related-links-schema.md`（relatedLinks / otherLinks + sourceKey metadata schema）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 啟動條件；§6）
- `CLAUDE.md`（專案規範主檔；§3.2 registry 治理 / §13 / §16.4 reverse UTM / §16.5 relatedLinks / §27 / §29 / §30）

---

End of checkpoint.
