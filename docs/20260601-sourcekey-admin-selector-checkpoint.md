# 2026-06-01 sourceKey Admin Selector Checkpoint

> Phase: `20260601-am-6-sourcekey-admin-selector-checkpoint-docs-only-a`
> Date: 2026-06-01 10:10 +0800
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `767c028c3426d29b6d78aa1a637e2ec363762c32`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **am-4 / am-5 之後的 docs-only checkpoint**：在
  - am-4 sourceKey Admin selector acceptance cross-check **PASS**
  - am-5 read-only next-work triage **PASS**
  之後，盤點目前 sourceKey / Admin selector / download / reverse UTM / Admin write infra 之 frozen state 與下一步候選。
- **sourceKey Admin selector preview 已完成並驗收，但仍為 read-only / disabled preview**：selector 為 `disabled <select>`（`aria-disabled="true"`）；無 Apply、無 form submit、無 middleware write route、無 safeWrite production caller、不寫回 `.md` frontmatter。
- 本文件**不授權任何 source implementation、write path、deploy 或 activation**。唯一變更為新增本 docs 檔。所有下游方向之啟動皆需 user explicit approval 之獨立 phase。
- 預期 commit 完成後 production state drift = 0；validate baseline 維持 `0 / 47 / 42` 不變。

### 1.1 一句話裁決

> **建議完成本 checkpoint commit + push 後 Final Idle Freeze / EXIT；任何 source implementation / write / deploy / activation 都需要獨立明示 phase；下次 cold-start 必須先 baseline verify。**

---

## 2. Final Baseline

| 項目 | 值 |
|---|---|
| repo path | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `767c028c3426d29b6d78aa1a637e2ec363762c32` |
| origin/main（本 phase 啟動時） | `767c028c3426d29b6d78aa1a637e2ec363762c32` |
| short | `767c028` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `feat(admin): add source key selector preview` |

---

## 3. Completed SourceKey Track Status

下列 sourceKey track 項目皆已落地並驗收（read-only / additive；不破壞既有 baseline）：

| 項目 | 狀態 | 位置 |
|---|---|---|
| **link-sources registry** | ✅ landed | `content/settings/link-sources.json`（8 sources；全 `isActive: true`；`sortOrder` 10–80） |
| **templates sourceKey field** | ✅ landed | relatedLinks / otherLinks 條目支援 `sourceKey` 欄位（per `docs/related-links-schema.md`） |
| **renderer fallback** | ✅ landed | post-detail / blogger-post-full renderer 讀 `sourceKey` 並 fallback；既有顯示行為不退化 |
| **GA4 `link_source_key`** | ✅ landed | sourceKey → GA4 `link_source_key` data attribute |
| **unknown sourceKey validation warning** | ✅ landed | 既有 `source-key-not-found` rule 捕捉引用 active registry 不存在之 sourceKey |
| **Admin read-only selector preview** | ✅ landed + 驗收（am-4 PASS） | `src/scripts/active-source-keys.js`（`buildActiveSourceOptions`）+ `src/scripts/load-admin-posts.js`（`extractLinkItemsForAdmin` / `sourceOptions` 串接）+ `src/views/admin/index.ejs`（disabled selector preview surface） |

備註：8 active sources 為 `blogger` / `github` / `bagel-books` / `life` / `tech-note` / `youtube` / `netflix` / `taipei-library`；當前全 active，使得 `source-inactive` 規則（未實作）無實際 warning。

---

## 4. Admin Selector Preview Status

am-3 落地、am-4 驗收 PASS 之 Admin selector preview surface 之確切邊界：

- ✅ relatedLinks / otherLinks 之每一條目已有 **sourceKey selector preview**（per-item row；顯示 `index` / `kind` / `platform` / current `sourceKey` / title / url + selector）。
- ✅ selector options 來自 **active link-sources registry**（`content/settings/link-sources.json` 之 `sources[]`；`isActive=false` 不顯示；`sortOrder` 升冪；per night-1 design §5.2）。
- ✅ `<select>` 為 **disabled**（`aria-disabled="true"`）；灰底 + `cursor: not-allowed`；不引導點擊。
- ✅ unknown / inactive sourceKey **僅視覺警告**（顯示「⚠ 未知 / inactive」badge + option；純顯示；不寫 `.md`；不觸發 validator）。
- ❌ **沒有 Apply**（無 Apply button；FB / SEO 之 `.apply-disabled` 永遠 disabled，無 click handler）。
- ❌ **沒有 form submit**。
- ❌ **沒有 middleware route**（無 server-side write handler；無 `fs.writeFile` 路徑）。
- ❌ **沒有 safeWrite production caller**（無 atomic write / dry-run / pre-write validate / post-write validate 之實際執行路徑）。

實作參考（read-only loader + render；不接 write path）：

- `src/scripts/active-source-keys.js:43-61`（`buildActiveSourceOptions`；只給 picker UI 4 欄 `sourceKey` / `displayLabel` / `sourceType` / `sortOrder`；不暴露 `defaultRel` / `defaultTrackingPolicy`）
- `src/scripts/load-admin-posts.js:126-141`（`extractLinkItemsForAdmin`；min subset 5 欄；read-only）
- `src/views/admin/index.ejs:634-698`（disabled selector preview surface；藍色 tint；mirror FB dry-run editor）

---

## 5. Dormant / Not-Started Items

下列項目目前 **dormant / not-started**；本 checkpoint **不授權 implementation**：

| 項目 | 狀態 |
|---|---|
| Admin Apply | ❄ disabled / dormant |
| Middleware write route | ❄ absent（無 route handler；無 server-side write） |
| admin-write-cli production use | ❄ dormant（不執行 dry-run / apply / real write） |
| `source-inactive` validator | ❄ not implemented（rule logic 本身未實作；8 sources 全 active） |
| sourceKey content migration | ❄ not started（不寫回 `.md` frontmatter） |
| download loader | ❄ dormant（`src/scripts/load-settings.js` 未串接） |
| download validator | ❄ dormant（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry 全未實作） |
| download picker | ❄ dormant |
| download renderer | ❄ dormant（landing page renderer 未實作） |
| download content migration（`fileUrl` → `assetRefs[]` / `formRef`） | ❄ dormant |
| reverse UTM activation | ❄ dormant（source landed；未 deploy；Blogger 後台未重貼） |
| pm-26 deploy gate unblock | ❄ BLOCKED |
| build / deploy / Blogger repost / GA4 validation | ❄ not authorized this phase |

---

## 6. Download Workflow State

- `content/settings/download-assets.json` 與 `content/settings/download-forms.json` 為 **empty registry landing**（landed at `466e471`）；shape = `{ schemaVersion: 1, updatedAt: "", assets|forms: [], notes: "" }`。
- loader / remaining validation rules 目前**只有 preanalysis / docs planning**，無 source：
  - `docs/20260601-download-loader-preanalysis.md`（loader 與 registry lookup 行為規劃；docs-only）
  - `docs/20260601-download-validation-remaining-rules-preanalysis.md`（尚未實作 rules 規劃；docs-only）
- **respondent data 不進 repo / Admin static files**（per `CLAUDE.md` §3.2 + registry 治理紅線 R1）：永不含 email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows / access token / API key / OAuth secret / 私人 Drive folder ID；Google Forms responses remain in Google Forms / Sheets。
- 本 checkpoint **不授權 download implementation**（loader / validator / picker / renderer / content migration 全 dormant）。

---

## 7. Reverse UTM / pm-26 State

| 項目 | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c） | ✅ landed origin/main（`7e1d356` / `e2309e9` / `7c769fe`；2026-05-23） |
| Reverse UTM live | ❄ **landed but dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED** |
| Positive fixture（phonics / GitHub cross-link） | ❄ `status: draft` / `draft: true`（不會出現在 dist / 線上） |
| Blogger repost | ❄ not started |
| GA4 validation | ❄ not started |

- positive fixture / phonics draft status 仍為 `draft` → **pm-26 gate remains blocked**。
- **本 checkpoint 不解除 gate**；不 deploy / 不 Blogger repost / 不 GA4 validation。
- pm-26 啟動條件詳見 `docs/reverse-utm-fixture-plan.md` §6（fixture 須符合 §3 設計原則與 §4 fixture 類型）。

---

## 8. Next-work Candidate Ranking

依保守程度排序（最保守在前）：

| 排序 | 候選 | 性質 | 風險 | 推薦 |
|---|---|---|---|---|
| 1 | **Final Idle Freeze / EXIT** | 不啟動任何 | 🟢 最低 | ⭐ **預設推薦** |
| 2 | sourceKey Admin selector docs sync / EOD checkpoint | docs-only（本檔即屬此類） | 🟢 低 | 僅 user 明示才再做 |
| 3 | source-inactive validator preanalysis | 新增單一 docs 檔 | 🟢 低 | 僅 user 明示才做下一個 docs-only preanalysis |
| 4 | download loader / remaining validation rules preanalysis | 新增單一 docs 檔 | 🟢 低 | 僅 user 明示才做（loader 在 validator rules 之前；per am-2 §11） |
| 5 | reverse UTM / pm-26 gate review | 純 read-only（不改檔） | 🟢 低 | 僅 user 明示；不可立即接 deploy |

推薦標示：

- **預設推薦 = Final Idle Freeze / EXIT。**
- 若 user 明示才做下一個 docs-only preanalysis（排序 3 / 4 之一）；僅啟動 user 明示之單一 candidate；不擴張 scope；不混合多 candidate。
- **不建議直接 source implementation**（任何 `src/**` / settings / fixture / build / deploy / Blogger / GA4 / Admin Apply / middleware / admin-write-cli 動作）。

---

## 9. Governance Redlines

本 checkpoint **明確不**授權下列任一動作：

- ❌ no source change（任何 `src/**` 變動）
- ❌ no content / settings / templates / fixtures / package / dist change
- ❌ no npm install
- ❌ no build / deploy
- ❌ no Blogger repost
- ❌ no GA4 validation
- ❌ no Admin Apply
- ❌ no middleware write route（新建 server-side write handler）
- ❌ no admin-write-cli dry-run / apply
- ❌ no reverse UTM activation
- ❌ no pm-26 unblock
- ❌ no download implementation（loader / validator / picker / renderer / content migration）
- ❌ no source-inactive validator implementation
- ❌ no fetch / pull / merge / rebase / reset / stash / amend / force-push

### 9.1 紅線（per `CLAUDE.md` §3.2 + 既有 registry 治理）

- **R1**：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID。
- **R2**：`download.fileUrl` 與 Google Form URL 不可混淆；不主動 migration。
- **R3**：landing page noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline；不變動 SEO pipeline。

---

## 10. Final Recommendation

**Final Idle Freeze / EXIT after this checkpoint commit + push.**

理由：

1. sourceKey Admin selector preview 已完成並驗收（am-4 PASS）；am-5 next-work triage PASS；無 in-flight 待落地之 source / content / settings change。
2. 所有下游方向（download / reverse UTM / Admin write）均為 dormant；無被動到期事項；無時間壓力。
3. **下次 cold-start 必須先 baseline verify**（pwd / branch / HEAD / origin/main / ahead-behind / working tree / `npm run validate:content`），確認仍為本 checkpoint commit 之延伸後再行動。
4. **任何 source implementation / write / deploy / activation 都需要獨立明示 phase**；不可在本 checkpoint 範疇內順手啟動。
5. 對齊 `CLAUDE.md` §1 / §29 / §30 之「**不過度工程化**」原則。

---

## Cross-references

- `docs/20260601-next-work-roadmap-preanalysis.md`（next-work roadmap；candidate ranking 上游）
- `docs/20260601-sourcekey-admin-selector-preanalysis.md`（sourceKey Admin selector preanalysis）
- `docs/20260601-download-loader-preanalysis.md`（download loader preanalysis）
- `docs/20260601-download-validation-remaining-rules-preanalysis.md`（download validation remaining rules preanalysis）
- `docs/related-links-schema.md`（relatedLinks / otherLinks + sourceKey metadata schema）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan；§15.F prerequisites）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 類型 / 啟動條件；§6）
- `CLAUDE.md`（專案規範主檔；§3.2 registry 治理 / §16.4 reverse UTM / §29 / §30）

---

End of checkpoint.
