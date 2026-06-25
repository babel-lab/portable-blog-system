# downloadFunnel — F3–F5 production content migration readiness map（docs-only）

- Phase id：`20260626-funnel-production-migration-readiness-map-docs-only`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**docs-only readiness map**（純分析 checklist；**不**實作 validator logic、**不**新增 fixture、**不** baseline bump、**不**碰 production content、**不**碰 live service）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 C / F / J / K / L 任何 source。
- 授權：Dean explicit approval（本 phase scope 限定 docs-only readiness map，唯一新增本檔）
- 性質：承接 `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md` 與 `docs/20260624-gated-download-funnel-spec-lock.md`，把「未來 F3–F5 production funnel 內容遷移前須滿足之條件、風險、執行順序」收斂為單一可引用 checklist。本文**不**啟動任何 source landing、**不**啟動任何內容遷移。

---

## 1. Baseline verification 摘要

進場 baseline（read-only）：

| 檢查 | 結果 |
| --- | --- |
| `git status --short` | （空）clean ✅ |
| `git status --branch --short` | `## main...origin/main`（無 ahead/behind 標記）✅ |
| `git rev-parse --abbrev-ref HEAD` | `main` ✅ |
| `git rev-parse HEAD` | `3477bba6240d14da6251a984f6a4a28169d6d7c0`（`3477bba`）✅ |
| `git rev-parse origin/main` | `3477bba…` ✅ |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` ✅ |
| `.git/index.lock` | 不存在 ✅ |
| `git log --oneline -10` top | `3477bba docs(download): preflight funnel dangling/absolute-url source` ✅ |

起點 subject 與要求一致；working tree clean；可安全進行 docs-only readiness map。

---

## 2. Sealed state 摘要（與本 readiness map 相關部分）

downloadFunnel validator（`src/scripts/validate-content.js`）已 landed slices（皆 warning-only / no-value-echo / additive / 0 production trigger）：

- **F2** structural / role-enum / suspicious-field（block 11）+ **F2 §5.2** required-combo（block 12）
- **F4 §5.4** role↔policy 一致性（sitemap-safety / listings-default / pageType-mismatch）
- **F6 §5.4** role↔robots-safety（重用 `resolvePostDetailRobots`）
- **F7 §5.3** value-based private-value heuristic（`looksLikePrivateFunnelLink`，純函式、no-value-echo）
- **F8 §5.4** bidirectional cross-file reciprocity（corpus pass；`normalizeFunnelRef`；2 方向 code）

fixture corpus（5 個 `.md`，全 placeholder）：

| Group | 檔案 | 行為 | bump |
| --- | --- | --- | --- |
| 1 valid | `_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md` | 0 warning | 不 bump |
| 2 deferred | `_test-download-funnel-dangling-target.md` / `_test-download-funnel-absolute-url-target.md` | 0 warning（deferred → silent） | 不 bump |
| 3 scanned invalid | `_test-download-funnel-invalid-entry.md` | 恰 1 warning（required-combo） | 已 bump |

validation baseline（carry-forward，本 phase 不變動、未跑任何 script）：

| 指令 | 結果 |
| --- | --- |
| `validate:content` | 0 / 134 / 106 |
| `report:validation` | 0 / 134 / 106 |
| overlay | 0 / 141 / 107 |
| `check-page-type-validator` | 103 / 0 |
| `check:validation-report` | 27 / 0 |
| production downloadFunnel trigger | **0** |

`downloadFunnel` 之概念欄位（`role` / `targetGatedPage` / `entryPages` / `ctaEventName`）目前**只**存在於 spec-lock §3 概念示意與 5 個 fixture；**尚未**進入任何 production `.md`。

---

## 3. Production trigger = 0 確認方式與結論

- 方式：read-only `grep` `downloadFunnel` 掃所有 `**/posts/**/*.md`。
- 結果：命中 5 檔，**全部**位於 `content/validation-fixtures/github/posts/`（即上表 5 個 fixture）；**無**任何 `content/github/posts/**` 或 `content/blogger/posts/**` production post 含 `downloadFunnel` 欄位。
- 旁證：唯一含「download 概念」之 production 頁 `content/github/posts/20260504-portable-blog-system-mvp.md` **不含** `downloadFunnel` 欄位，故不觸發任何 funnel rule。
- **結論：production downloadFunnel trigger = 0 屬實。** 本 readiness map 所描述之未來遷移，皆為「從 0 觸發狀態開始新增 production funnel metadata」。

---

## 4. F3–F5 production funnel migration 前置條件

下列條件須在開始任一 production gated download 內容遷移（spec-lock §7 之 F3 / F4 / F5）**之前**滿足。每項標注是否阻擋（🔴 hard prerequisite）或建議（🟡 recommended）。

### 4.1 內容 spec ready

| # | 前置條件 | 阻擋 | 說明 |
| --- | --- | --- | --- |
| C-1 | **gated download page content spec ready** | 🔴 | layer B 之 intro / form 前說明 / 使用限制 / feedback / post-submit 顯示文案由 Dean 定稿（spec-lock §3.2 / §5.1）。 |
| C-2 | **indexed entry page content spec ready** | 🔴 | layer A 之介紹 / 圖片 / 更新紀錄 / **visible** summary·FAQ·intro（**不得** hidden SEO copy，spec-lock §1.4 / §6）/ CTA 文案由 Dean 定稿。 |
| C-3 | gated page reciprocal metadata ready | 🟡 | entry→gated（`downloadFunnel.targetGatedPage`）與 gated→entry（`downloadFunnel.entryPages[]`）兩端互指；F8 bidirectional reciprocity 已可驗（缺一端 → warning，但目前 deferred-silent dangling 除外，見 §6）。 |

### 4.2 既有 policy 欄位 ready（皆既有 schema，無新欄位）

| # | 欄位 | layer A entry | layer B gated | 說明 |
| --- | --- | --- | --- | --- |
| P-1 | `seo.indexing` | `index-follow`（或省略） | `noindex-follow` | spec-lock §3.1 / §3.2 / §6 |
| P-2 | `includeInSitemap` | `true`（或省略） | `false` | gated 顯式排除（safety 已涵蓋，顯式更穩） |
| P-3 | `includeInListings` | `true`（或省略） | `false` | gated Slice 2 後 default-exclude；顯式 false 更穩 |
| P-4 | `pageType` | `article` 或 `landing` | `gated_download` | 與 `contentKind` 正交（CLAUDE.md §11） |
| P-5 | `contentKind` | `post` / `tech-note` / `life-note` 等 | `download` | 體裁，獨立於 pageType |
| P-6 | `platformPolicy.{github,blogger,future}` | 視合併策略 | 三平台皆 `noindex-*` | 記錄事實；**不**存 token / secret（SP-8 warn） |
| P-7 | `canonical` | 視合併策略 | 顯式，不可 `auto` | spec-lock §3.2 |

### 4.3 Google Form / Drive 真實連結準備

| # | 前置條件 | 阻擋 | 說明 |
| --- | --- | --- | --- |
| G-1 | Google Form public **embed** URL 就緒 | 🔴 | 由 Dean 手動準備；只填 `gatedDownload.formEmbedUrl`（public embed only）。 |
| G-2 | post-submit resource 真實連結就緒 | 🔴 | 由 Dean 於 Google Form 端設定；repo 端**只**記 `gatedDownload.postSubmitResource` 列舉值（spec-lock §3.3）。 |
| G-3 | **真實連結不得寫入 repo** | 🔴 red line | Drive folder/file ID、Form edit/response URL、token、respondent data **永遠**留在 Google Form / Sheets / Drive，不進 repo（CLAUDE.md §13 red line / spec-lock §3.2 §3.3）。 |
| G-4 | `gatedDownload` 只允許 `{mechanism, formEmbedUrl, postSubmitResource}` 三 key | 🔴 | 其他 key 觸發 `page-gated-download-suspicious-field`（no-value-echo）。 |

### 4.4 no-value-echo / placeholder discipline

| # | 前置條件 | 說明 |
| --- | --- | --- |
| N-1 | fixture / docs 一律 placeholder | 任何示範 funnel metadata 不得用真實 Drive ID / Form URL / token。 |
| N-2 | validator warning 不 echo value | F7 / bidirectional 已守紀律；未來任何新 warning 沿用（preflight §6.5）。 |
| N-3 | `targetGatedPage` / `entryPages[]` 為 **slug 或 public URL only** | **不得**填 Drive folder / Form 私密 URL（spec-lock §3.2 red line）。 |

### 4.5 GA4 / ctaEventName 狀態

| # | 項目 | 狀態 |
| --- | --- | --- |
| GA-1 | `downloadFunnel.ctaEventName` GA4 normalization | ⏸ **deferred**（`click_all_download` 既有 vs `download_cta_click` 候選未裁定；spec-lock §2.4 / §7 F7） |
| GA-2 | 本 readiness map 是否解 GA4 | ❌ 否；GA4 維度未到遷移臨界，屬獨立 preflight（候選 C，未啟動） |
| GA-3 | 內容遷移期是否需 GA4 改動 | ❌ 否；entry/gated `.md` 可先落 metadata，CTA event 命名沿用既有，GA4 backend 不動 |

---

## 5. 建議 migration order

目標：**避免 F8 bidirectional reciprocity 在遷移期產生 transient warning noise**，同時保持每一步 working-tree-warning-free。

### 5.1 建議順序（單一 family 內）

1. **先準備 gated page metadata**（layer B，`role: gated_page`）—— 但**先不**填 `entryPages[]`（或填後立即配對），避免單向 dangling。
2. **再準備 entry page metadata**（layer A，`role: entry`，`targetGatedPage` 指向 gated slug）。
3. **儘量同一 phase landing pair**：entry + gated 於**同一 commit** 落地，使兩端 slug 立即互相可解析 → reciprocity 0 warning（mirror group 1 valid pair 之 sealed 行為）。
4. 三 family（注音 / 練練看 / 數字卡，spec-lock §4）各自為**獨立 pair landing phase**；不混批。

### 5.2 若必須分批（entry 與 gated 不同 commit）

當前 validator 行為對「分批」是**友善**的，因為 dangling simple slug 目前 **deferred → silent**（preflight §3 / §4；C5 lock）：

- 先落 **entry**、後落 gated：entry 的 `targetGatedPage` 指向尚不存在之 gated slug → **dangling → silent**（0 warning）。✅ 暫時 warning-free。
- 先落 **gated**、後落 entry：gated 的 `entryPages[]` 列尚不存在之 entry slug → **dangling → silent**（0 warning）。✅ 暫時 warning-free。
- ⚠️ **但**：一旦兩端都存在卻**未互指**（一端列了對方、對方未回指），F8 reciprocity 會 warn（`entry-page-not-listed-by-gated-page` / `gated-page-not-targeted-by-entry`）。故分批落地時，**第二步必須同時補齊雙向互指**，否則留下 reciprocity warning。
- 結論：**分批可行且當前 warning-free**，正是 candidate A（dangling→warning）維持 deferred 的關鍵理由 —— 若 A 落地，先落 entry 的 dangling 期會變成 noise。

### 5.3 與 candidate A 的關係

- **本 readiness map 之 §5.2 分批友善性，依賴 dangling 維持 deferred-silent。**
- 因此在 F3–F5 內容遷移**完成且穩定**之前，candidate A（`20260626-funnel-dangling-target-not-found-warning-source-landing-a`）**應維持 deferred**（見 §6）。

---

## 6. A source landing 的重新啟動條件

Candidate A = `20260626-funnel-dangling-target-not-found-warning-source-landing-a`（把 dangling simple slug 從 silent 改為 warning）。**目前 deferred**。重新啟動須**同時**滿足：

| # | 重啟條件 | 目前狀態 |
| --- | --- | --- |
| A-1 | production funnel content 開始存在（≥1 個 production gated/entry pair 已 land） | ❌ 未達（trigger=0） |
| A-2 | F3–F5 內容遷移已穩定（不再有 entry/gated 先後落地之 transient dangling 期） | ❌ 未達 |
| A-3 | 有明確需求讓「dangling simple slug」變成 warning（例如要早期攔截作者打錯 slug） | ❌ 目前 value=0 |
| A-4 | 願意執行 fixture reclassify（group 2 dangling fixture 由 0-warning → scanned invalid）+ baseline bump + `check-validation-report.js` C5/B6 update + §3a snapshot sync | ❌ 未授權 |
| A-5 | Dean explicit approval | ❌ 未給（本 phase 明示不批准 A） |

→ **A 仍 deferred 合理**：production value=0、且現在落地會在 F3–F5 遷移期製造 transient warning noise。本 phase **不**批准 A。

---

## 7. 未來可能 phase 拆分

mirror spec-lock §7，聚焦 funnel 內容 / source 維度（實際日期前綴以落地當日為準；本 phase **不**佔位、**不**啟動任一）：

| label | 範圍 | 類型 | 前置 |
| --- | --- | --- | --- |
| F3 gated page content draft / metadata-only | 注音下載頁（spec-lock §4 #1）gated `.md`，metadata + 內容 | 內容遷移 | §4 全部前置 + Dean 內容定稿 |
| F4 entry page content draft / metadata-only | 注音字卡介紹 entry `.md`，metadata + visible summary | 內容遷移 | F3 或同批 |
| F5 pair landing / validation | entry+gated 同 commit 落地並驗 reciprocity 0 warning | 內容遷移 + validation | F3 + F4 |
| （重複）練練看 / 數字卡 family | 各自 pair landing phase | 內容遷移 | 各 family 內容定稿 |
| A dangling→warning source landing | candidate A（§6） | source landing + bump | §6 A-1…A-5 全滿足 |
| absolute URL / host-mismatch preflight | preflight §6.2 / §6.3 維度 | docs-only preflight | site host 設計 |
| ctaEventName / GA4 preflight | GA4 event 命名統一（§4.5） | docs-only preflight | GA4 dashboard observation |

---

## 8. 風險表

| # | 風險 | 觸發情境 | 緩解 |
| --- | --- | --- | --- |
| R-1 | **transient dangling** | 分批落地（entry/gated 不同 commit）期間單向 ref | 當前 deferred-silent → 0 warning；維持 A deferred；或同 commit pair landing（§5.1） |
| R-2 | **accidental indexing of gated page** | gated `.md` 漏設 `seo.indexing: noindex-*` / `pageType: gated_download` | F4/F6 robots-safety warn；GitHub robots 自動 noindex；Blogger 須後台手動 NO INDEX（系統無法 inject，spec-lock §2.5 / §6） |
| R-3 | **sitemap / listing leakage** | gated `.md` 漏設 `includeInSitemap:false` / `includeInListings:false` | F4 listings-default warn；safety 自動 exclude；顯式 false 更穩 |
| R-4 | **real Drive / Form URL leakage** | 把真實連結寫進 `targetGatedPage` / `entryPages` / `gatedDownload` | F7 private-value warn（no-value-echo）；red line G-3；真實連結只留 Google 端 |
| R-5 | **cross-platform absolute URL false positive** | 合法跨平台 absolute URL 被誤判 | 目前 absolute URL deferred-silent（不 warn）；未來若升級須先界定合法 host（preflight §6.2 / §6.3） |
| R-6 | **GA4 backend / live tracking 誤觸** | 遷移期改動 GA4 event / dimension | 本線 GA4 deferred（§4.5）；內容遷移不需動 GA4 backend；CTA 命名沿用既有 |

---

## 9. 明確 deferred（本 phase 一律不做）

- ❌ no source logic change（`validate-content.js` / `check-validation-report.js` / 任何 src / scripts 未動）
- ❌ no fixture change（5 個 funnel fixture 未增未改）
- ❌ no baseline bump（未跑 `validate:content` / `report:validation` / `check:*`）
- ❌ no production content migration（無 production `.md` 新增 `downloadFunnel`）
- ❌ no live Blogger / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path
- ❌ A source landing remains deferred（§6）
- ❌ 未寫入真實 Drive ID / Form URL / token / secret / respondent data（全 placeholder / 概念示意）
- ❌ 未改 `CLAUDE.md` / `MEMORY.md` / `memory/`
- ❌ 未 build / deploy / dev server / preview / repost
- ❌ 未 rebase / amend / force-push

---

## 10. Cross-links

- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel spec 唯一定義來源；§3 三層 / §4 page family / §7 future phases）
- `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md`（dangling / absolute-URL / host-mismatch deferred-silent 行為盤點）
- `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 valid pair）
- `docs/20260625-download-funnel-md-fixture-group2-landing-record.md`（group 2 deferred-cases）
- `docs/20260625-group3-scanned-invalid-bump-landing-record.md`（group 3 scanned invalid + baseline bump）
- `src/scripts/validate-content.js`（`normalizeFunnelRef` / `looksLikePrivateFunnelLink` / bidirectional block）
- `src/scripts/check-validation-report.js`（C5 / C6 / C7 / B6 / B7 locks；BASELINE）
- `CLAUDE.md` §3a（frozen baseline + validation baseline 表）/ §11 / §13 / §16 / §21 / §24

---

`VERDICT: DOCS-ONLY READINESS MAP LANDED`
`A SOURCE LANDING REMAINS DEFERRED`
`NO SOURCE / FIXTURE / BASELINE CHANGE`
`NO PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`READY FOR IDLE FREEZE`

（本文件結束）
