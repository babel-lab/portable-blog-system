# downloadFunnel — production content input packet（docs-only operator intake）

- Phase id：`20260627-funnel-production-content-input-packet-docs-only-a`
- 日期：2026-06-27（Asia/Taipei）
- 類型：**docs-only operator intake packet**（placeholder-only 填空清單；**不**實作 validator logic、**不**新增 fixture、**不** baseline bump、**不**碰 production content、**不**碰 live service、**不**做 source landing、**不**啟動 pair landing）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 B / C / E / F / J / K / L 任何 source 或 production content。
- 授權：Dean explicit approval（本 phase scope 限定 docs-only operator intake，唯一新增本檔）
- 性質：承接 `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（§4.1 C-1/C-2 內容 spec 🔴、§4.3 G-1/G-2 Form/Drive 🔴）、`docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（layer A 作者 checklist）與 `docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`（layer B 作者 checklist）。現有三份 docs 皆為 **analyst-facing**（條件 / 風險 / 盲點）；本文補上唯一缺口 —— **operator-facing 填空式 intake**：把「Dean 未來實際遷移前須親手準備之內容素材與外部資源狀態」收斂成一張可勾選 / 可填空的清單。**本文一律 placeholder，不放任何真實內容 / URL / token / Drive ID / respondent data。**

---

## 1. Baseline verification 摘要

進場 baseline（read-only，未跑任何 validation / build / script）：

| 檢查 | 結果 |
| --- | --- |
| `git status --short` | （空）clean ✅ |
| `git status --branch --short` | `## main...origin/main`（無 ahead/behind 標記）✅ |
| `git rev-parse --abbrev-ref HEAD` | `main` ✅ |
| `git rev-parse HEAD` | `2a66231d2d3ebe95f3eeb3e0f0f37254f38288bb`（`2a66231`）✅ |
| `git rev-parse origin/main` | `2a66231…` ✅ |
| HEAD == origin/main == `2a66231d2d3ebe95f3eeb3e0f0f37254f38288bb` | ✅ |
| ahead / behind | `0 / 0` ✅ |
| `.git/index.lock` | 不存在 ✅ |
| `git log --oneline -10` top subject | `docs(download): preflight gated download page metadata` ✅ |

起點 subject 與要求一致；working tree clean；可安全進行 docs-only operator intake。

---

## 2. Sealed state + production trigger = 0 摘要

downloadFunnel validator（`src/scripts/validate-content.js`）已 landed slices（皆 warning-only / no-value-echo / additive / 0 production trigger）：F2（structural / role-enum / suspicious-field + §5.2 required-combo）、F4（role↔policy）、F6（role↔robots-safety）、F7（private-value heuristic）、F8（bidirectional reciprocity）。

fixture corpus（5 個 `.md`，全 placeholder）：group1 valid pair（0 warning，未 bump）、group2 dangling + absolute-URL（deferred-silent，0 warning，未 bump）、group3 scanned invalid（恰 1 warning，已 bump）。

validation baseline（carry-forward，本 phase 不變動、未跑任何 script）：

| 指令 | 結果 |
| --- | --- |
| `validate:content` | 0 / 134 / 106 |
| `report:validation` | 0 / 134 / 106 |
| overlay | 0 / 141 / 107 |
| `check-page-type-validator` | 103 / 0 |
| `check:validation-report` | 27 / 0 |
| production downloadFunnel trigger | **0** |

read-only grep（`downloadFunnel` 掃 `content/**/posts/**/*.md`）命中 5 檔，**全部**位於 `content/validation-fixtures/github/posts/`；**無**任何 production post 含 `downloadFunnel`。→ **production downloadFunnel trigger = 0 屬實。**

---

## 3. 本 packet 的定位（scope note）

- ✅ 本文 = **operator intake**：列出 Dean 未來要準備什麼、目前準備到哪、外部資源狀態，**全 placeholder**。
- ❌ **不是 production content migration**：本文不新增任何 production `.md`、不寫任何真實文案。
- ❌ **不是 pair landing**：不落地 entry/gated pair、不觸發 reciprocity。
- ❌ **不是 source landing**：不改任何 validator / script / helper。
- 填寫方式：Dean 於未來實際備料時，把每個 `[ ]` 勾起、把 `<…placeholder…>` 換成真實內容（真實內容**寫在草稿區 / Google 端，不一定進 repo**；真實 Form/Drive 連結**永不**進 repo，見 §6 / §7 / §10）。

---

## 4. Layer A — indexed entry page 素材（Dean 需準備）

對應 readiness map C-2（🔴 hard prerequisite）+ entry preflight（`docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`）E-1…E-9。**全 placeholder。**

| # | 素材項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| A-1 | entry page title | `<entry page title placeholder>` | [ ] | 對應 frontmatter `title` |
| A-2 | intro / summary | `<intro / summary placeholder>` | [ ] | **必須 visible**（不得 hidden SEO copy；spec-lock §1.4 / §6） |
| A-3 | image / visual asset readiness | `<image or visual asset readiness placeholder>` | [ ] | 只記就緒狀態；圖片不由系統自動上傳（CLAUDE.md §22） |
| A-4 | update log | `<update log placeholder>` | [ ] | 可見更新紀錄 |
| A-5 | CTA copy | `<CTA copy placeholder>` | [ ] | 顯式可見 button / link，指向 gated page（不得 hidden） |
| A-6 | target gated page slug | `<target gated page slug placeholder>` | [ ] | 填 simple slug；對應 `downloadFunnel.targetGatedPage`（見 §8） |
| A-7 | canonical / future merged-domain decision | `<canonical / future merged domain decision placeholder>` | [ ] | 開放決策，未裁定（entry preflight §7；本文不裁定） |

---

## 5. Layer B — noindex gated download page 素材（Dean 需準備）

對應 readiness map C-1（🔴 hard prerequisite）+ gated preflight（`docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`）G-1…G-12。**全 placeholder。**

| # | 素材項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| B-1 | gated page title | `<gated page title placeholder>` | [ ] | 對應 frontmatter `title` |
| B-2 | form intro copy | `<form intro copy placeholder>` | [ ] | Form 前說明 |
| B-3 | usage restriction copy | `<usage restriction copy placeholder>` | [ ] | 使用限制（個人 / 家庭 / 教學；不得轉售，CLAUDE.md §13） |
| B-4 | feedback / support copy | `<feedback / support copy placeholder>` | [ ] | 回饋 / 支援文案 |
| B-5 | post-submit display copy | `<post-submit display copy placeholder>` | [ ] | 送出後顯示文案（顯示用，不含真實資源連結） |
| B-6 | entry page slug list | `<entry page slug list placeholder>` | [ ] | 哪些 entry 指向本頁；對應 `downloadFunnel.entryPages[]`（見 §8） |

---

## 6. Google Form readiness section

對應 readiness map G-1（🔴）。**只記就緒狀態與非敏感標題；真實連結不進 repo。**

| # | 項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| F-1 | public embed availability status | `<public embed availability status placeholder>` | [ ] | 只記「public embed 是否就緒」狀態 |
| F-2 | form title | `<form title placeholder>` | [ ] | 非敏感標題 |
| F-3 | `gatedDownload.formEmbedUrl` 來源 | `<public embed url placeholder — fill at migration only>` | [ ] | 遷移當下才填 **public embed URL**（唯一可入 repo 之 Form 連結） |

🔴 **red line（Form）**：

- ❌ **do not include real Form URL**（本 packet 不放真實連結）
- ❌ **do not include edit URL**（Form edit URL 永不進 repo）
- ❌ **do not include response URL**（Form response URL 永不進 repo）
- ❌ Google Forms responses **永遠**停留在 Google Forms / Sheets，不進 repo

---

## 7. Google Drive / resource readiness section

對應 readiness map G-2（🔴）。**只記就緒狀態與列舉值；真實 Drive 連結不進 repo。**

| # | 項目 | placeholder | 就緒 | 備註 |
| --- | --- | --- | --- | --- |
| D-1 | file readiness status | `<file readiness status placeholder>` | [ ] | 只記「post-submit 資源是否就緒」狀態 |
| D-2 | resource type | `<resource type placeholder>` | [ ] | 資源類型描述（非連結） |
| D-3 | `postSubmitResource` enum | `<postSubmitResource enum placeholder — one of: drive-link / external-after-submit / confirmation-only / inline-resource>` | [ ] | **只**填列舉值（spec-lock §3.3） |

🔴 **red line（Drive / resource）**：

- ❌ **do not include real Drive ID**（Drive folder ID / file ID 永不進 repo）
- ❌ **do not include real Drive URL**
- ❌ **do not include token or respondent data**（OAuth token / API key / Email / IP / name 永不進 repo）
- ✅ 真實 post-submit 資源連結由 Dean 於 Google Form 端設定，repo 端**只**記 `postSubmitResource` 列舉值

---

## 8. Slug and reciprocity pairing section

對應 readiness map C-3（🟡）+ F8 bidirectional reciprocity。**只填 simple slug placeholder。**

| # | 項目 | placeholder | 備註 |
| --- | --- | --- | --- |
| S-1 | entry slug | `<entry slug placeholder>` | simple slug |
| S-2 | gated slug | `<gated slug placeholder>` | simple slug |
| S-3 | entry `downloadFunnel.targetGatedPage` | `<entry targetGatedPage placeholder = gated slug>` | 須等於 S-2 |
| S-4 | gated `downloadFunnel.entryPages[]` | `<gated entryPages placeholder = [entry slug, ...]>` | 須列回 S-1 |

⚠️ **note**：**real pair landing should happen together later** —— entry + gated 建議於**同一 commit** 落地，使兩端 slug 立即互相可解析 → F8 reciprocity 0 warning（mirror group 1 valid pair sealed 行為；readiness map §5.1）。本 packet **不**落地 pair、**不**填真實 slug。`targetGatedPage` / `entryPages[]` 一律 simple slug 或 public URL，**不得**填 Drive / Form 私密 URL（否則 F7 private-value warn）。

---

## 9. Per-family grouping section

對應 spec-lock §4 page family。**三 family 各自獨立 pair landing phase，不混批。**

| # | family | placeholder | 備註 |
| --- | --- | --- | --- |
| P-1 | 注音字卡 family | `<phonics family placeholder>` | 獨立 pair landing phase |
| P-2 | 練練看（practice worksheet）family | `<practice worksheet family placeholder>` | 獨立 pair landing phase |
| P-3 | 數字卡（number cards）family | `<number cards family placeholder>` | 獨立 pair landing phase |

⚠️ **do not mix families in one landing phase**（spec-lock §4；readiness map §5.1 #4）—— 每個 family 各自為獨立 pair landing phase，不可混批。

---

## 10. Red-line checklist

本 packet 全程遵守，未來填寫亦須遵守：

- ✅ **placeholder only**
- ❌ **no real Google Form URL**（embed / edit / response 一律不放；唯 public embed 於遷移當下才填入 gated `.md`）
- ❌ **no real Google Drive ID or URL**
- ❌ **no token**
- ❌ **no secret**
- ❌ **no respondent data**（Email / IP / name 永留 Google 端）
- ❌ **no live service access**（Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console 皆不碰）
- ❌ **no Admin write path**

---

## 11. Cross-links

- `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（readiness map；§4 前置 / §5 migration order / §6 A deferred）
- `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（entry preflight，layer A）
- `docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`（gated preflight，layer B）
- `docs/20260624-gated-download-funnel-spec-lock.md`（spec-lock，funnel 唯一定義來源）
- `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md`（dangling / absolute-URL deferred-silent 行為盤點）
- group 1 valid entry/gated fixtures：`content/validation-fixtures/github/posts/_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md`
- `src/scripts/validate-content.js`（`normalizeFunnelRef` / `looksLikePrivateFunnelLink` / bidirectional block / F2 required-combo / F4 / F6）
- `src/scripts/check-validation-report.js`（C5 / C6 / C7 / B6 / B7 locks）
- `CLAUDE.md` §3a / §11 / §13 / §16 / §21 / §22 / §24

---

## 12. 明確 deferred（本 phase 一律不做）

- ❌ **no source change**（`validate-content.js` / `check-validation-report.js` / 任何 src / scripts / helpers / EJS / selector 未動）
- ❌ **no fixture change**（5 個 funnel fixture 未增未改）
- ❌ **no baseline bump**（未跑 `validate:content` / `report:validation` / `check:*` / 任何 script）
- ❌ **no production content migration**（無 production `.md` 新增 `downloadFunnel` / entry / gated 內容）
- ❌ **no pair landing** / **no entry/gated production content**
- ❌ **no live Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path**
- ❌ **A source landing remains deferred**（`20260626-funnel-dangling-target-not-found-warning-source-landing-a`；readiness map §6 A-1…A-5 未達）
- ❌ 未寫入真實 Drive ID / Form URL / token / secret / respondent data（全 placeholder）
- ❌ 未改 `CLAUDE.md`（含 §3a prose SHA cosmetic lag）/ `MEMORY.md` / `memory/`
- ❌ 未改 settings / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML
- ❌ 未 build / deploy / dev server / preview / repost
- ❌ 未 rebase / amend / force-push
- ❌ 未執行任何 slash command

---

`VERDICT: DOCS-ONLY INPUT PACKET LANDED`
`PLACEHOLDER ONLY`
`A SOURCE LANDING REMAINS DEFERRED`
`NO SOURCE / FIXTURE / BASELINE CHANGE`
`NO PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

（本文件結束）
