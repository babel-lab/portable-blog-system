# B2 Phase C — Blogger preview artifact builder（reusable renderer + local-only preview build）

- 建立日期：2026-07-17（Asia/Taipei）
- 類型：**source-only** landing note（renderer 抽出 + preview builder + focused guard + docs）
- 上位契約：`docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2（Variant B2）/ §7 allowed / §8 forbidden / §9 gates / §11.2 acceptance
- 前置：`docs/20260717-blogger-preview-plan-b2-phase-a.md`（Phase A：draft-aware **target planner**，dry-run only；commit `22f1789`）
- 本輪 baseline：source `main` = `origin/main` = `22f1789`、clean、0/0、index.lock absent；deploy clone `gh-pages` = `origin/gh-pages` = `0eaf9c6`、clean、0/0（**read-only 驗證，未寫入**）

---

## 1. 本切片做了什麼

一句話：**把 Blogger 單篇 render 邏輯自 `build-blogger.js` 抽成共用 renderer，並用它做出 draft-aware 的本機 preview builder；正式 `build:blogger` 輸出經證明未被改壞。**

| # | 交付 | 檔案 |
| --- | --- | --- |
| 1 | 可重用 renderer（正式 build 與 preview **共用同一實作**） | `src/scripts/blogger-render.js`（新增） |
| 2 | 正式 build 改為 orchestration-only（委派共用 renderer） | `src/scripts/build-blogger.js`（改） |
| 3 | draft-aware entry 組裝（additive、**預設關閉**） | `src/scripts/load-posts.js`（改） |
| 4 | local-only preview artifact builder | `src/scripts/build-blogger-preview.js`（新增） |
| 5 | focused contract guard（61 assertions） | `src/scripts/check-build-blogger-preview.js`（新增） |
| 6 | Phase A guard 之過期斷言修正 | `src/scripts/check-blogger-preview-plan.js`（改） |
| 7 | npm scripts ×2 + gitignore | `package.json` / `.gitignore` |
| 8 | docs | 本檔 + `README.md` + runbook + preanalysis + Phase A doc |

---

## 2. Canonical command

```bash
npm run build:blogger-preview -- --slug=<slug>
```

可選：`--site=github|blogger`（消 duplicate slug 歧義）、`--json`（machine-readable）。

**強制單一 slug**：不支援「全部」模式（避免無腦把全站 draft 都產進 preview dist）。列出 candidates 請用 `npm run check:blogger-preview`；只要計畫不要產檔請用 `npm run blogger:plan-preview -- --slug=<slug>`。

### 支援之 target status

| target | 結果 |
| --- | --- |
| draft blogger-native（`draft: true`） | ✅ 產出（**這正是 B2 的目的**：不必改 frontmatter 即可預覽） |
| ready blogger-native | ✅ 產出 |
| ready / draft github-cross 且 `publishTargets.blogger.enabled: true` | ✅ 產出（mode 沿用 frontmatter） |
| github-cross 但 `blogger.enabled: false` | ❌ hard-fail `not-a-blogger-target`（exit 8；**不靜默通過**） |
| 未知 slug / 壞 frontmatter / duplicate slug | ❌ hard-fail（exit 4 / 6 / 5） |

---

## 3. Output contract

```text
dist-blogger-preview/posts/<slug>/post.html
dist-blogger-preview/posts/<slug>/copy-helper.txt
dist-blogger-preview/posts/<slug>/meta.json
```

- 內部結構沿用正式 Blogger build（同一 renderer、同一 EJS 模板、同一 `meta.json` schema）。
- **刻意不產** `publish-checklist.txt`：preview 產物不供正式發布流程使用（沿用 Phase A 之 `PREVIEW_PLANNED_FILES` 宣告）。
- **刻意不產** blogger-home / category index / `build-manifest.json`：那些屬正式 build 之全站產物。
- `dist-blogger-preview/` 已加入 `.gitignore`。

---

## 4. Preview-only safety markers

三種載體（人工可見 / guard 可斷言 / deploy workflow 不可能誤認）：

| 載體 | 形式 |
| --- | --- |
| `post.html` | **檔首** HTML 註解區塊，首行即 `PREVIEW-ONLY / NOT FOR DEPLOY` |
| `copy-helper.txt` | 檔首純文字橫幅，含 `PREVIEW-ONLY / NOT FOR DEPLOY` |
| `meta.json` | `preview: { marker, previewOnly: true, notForDeploy: true, generatedBy: "build:blogger-preview", draftAware: true, officialBuild: { includes, reason } }` |

marker 字串來源 = Phase A 之 `PREVIEW_MARKER` export（單一事實來源；planner 與 builder 不可能漂移）。

**反向保證**：guard E1 斷言 `build-blogger.js` / `blogger-render.js` 之**執行程式碼**與 `src/views/blogger/*.ejs` 模板皆不含 marker → marker 不可能滲入正式 `dist-blogger/`。本輪 pre/post 快照比對亦實測確認正式產物 0 個 marker token。

---

## 5. Safety boundaries（本工具**不做**什麼）

- ❌ 不改 frontmatter / `.publish.json` / `.fb.md` / `content/settings/` / 任何 content
- ❌ 不動正式 `dist-blogger/`（不建立 / 不修改 / 不刪除）；不動 `dist/` / `dist-promotion/` / `dist-reports/`
- ❌ 不改 `build:blogger` 行為、不改 `classify`、不讓 draft 進正式 dist（CLAUDE.md §23）
- ❌ 不提供 `--apply` / `--deploy` / `--publish` / `--push` / `--write` / `--force` / `--commit` / `--output` / `--out-dir`（**明確 hard-fail exit 2，非靜默忽略**）
- ❌ 無 output override：CLI 之 output root 恆為 canonical `dist-blogger-preview/`，不接受任何使用者輸入路徑
- ❌ 不 commit / push / deploy / 碰 gh-pages / 碰 deploy clone
- ❌ **不需 Blogger 登入**；不呼叫 Blogger / Google / GA4 / AdSense / Drive API；**零網路**；不讀 credential / env
- ❌ 不猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`

### Output root 安全閘（`assertSafeOutputRoot`）

允許清單（僅兩者）：canonical `<projectRoot>/dist-blogger-preview`，或 OS temp 目錄底下（**僅** contract guard 之隔離驗證用；CLI 永不走此分支）。

明確拒絕（exit 9 `unsafe-output-root`）：正式 `dist-blogger/` 及其子目錄 / repository root / repo root 之祖先目錄 / `dist` / `dist-promotion` / `dist-reports` / deploy clone（`portable-blog-deploy` / `gh-pages`）/ 非絕對路徑 / 其餘 repo 外任意路徑。

### Rollback / cleanup

- 所有內容**先 render 至記憶體**，全部成功才寫檔 → render 失敗不留任何半成品。
- 落地採 staging dir + **atomic rename**；失敗則清除 staging 後回報 `write-failed`。
- 成功後 `.staging` 不殘留（guard C13 斷言 preview root 僅含 `posts/`）。
- 被拒之 target / flag / output root **不建立任何目錄**（連空目錄都不行；guard A3 / A5 / B4 / B5 / B6 / C12）。

---

## 6. Renderer extraction 設計

**為何需要**：`build-blogger.js` 原為 913 行、**零 export**、且 top-level 直接 `main().catch(...)` → **import 即觸發整包正式 build**（會建立 / 覆寫 `dist-blogger/`）。這是 Phase A 只能停在 planner、無法 render draft 的結構性原因。

**抽出邊界**：

| 留在 `build-blogger.js`（orchestration） | 移至 `blogger-render.js`（可重用） |
| --- | --- |
| `loadBloggerPosts`（**ready-only 過濾**）、`validateContent` | canonical / OG / JSON-LD / Book mainEntity |
| 所有 `dist-blogger/` 寫檔、console log | mode dispatch（full / summary / redirect-card / placeholder） |
| blogger-home / category index、`build-manifest.json` | cross-links / gated download / operator guidance |
| `main()` + top-level 呼叫 | `buildMeta` / `renderCopyHelper` / `renderPublishChecklist` |
| | **`renderBloggerPost()` = 共用單篇 pipeline** |

**import-time 契約**：`blogger-render.js` **完全不 import `node:fs`**（guard C9 以原始碼斷言，C10 以子行程實測 import 後 cwd 無任何檔案產生）。所有 export 回傳字串 / 物件；輸出路徑由 caller 以參數決定 → renderer **不可能**污染正式 dist。

**內容選擇規則不變**：renderer 對「誰該被 render」無意見；ready-only 過濾完全留在正式 build 那一層。故 renderer 可 render draft，而 `build:blogger` 仍永不收 draft。

**唯一非逐字搬移處**：`buildMeta()` 之 `rel()` 由硬編 `PROJECT_ROOT` 改為顯式 `projectRoot` 參數 —— 計算結果相同（見 §7 parity 實測）。

### `load-posts.js` 之 additive 改動（**預設關閉**）

`processMarkdownEntry` 改為 exported，並新增 option `includeFiltered`（**預設 `false`**）。

- 動機：preview 需要與正式 build **完全相同**的 entry 組裝結果（frontmatter + sidecars + `normalized`），否則必須另抄一份組裝邏輯 → 必然漂移。
- 契約：`includeFiltered` **只**影響「被 `classify` 排除者是否仍組裝 entry」，**不影響 `included` 之值** —— 被排除者恆回 `included: false`。
- 唯一既有 caller（`loadPosts`）不傳此參數 → 走與改動前**完全相同**的分支與輸出。
- **未放寬 `classify`**、未改任何過濾規則（guard E3 / E4 直接斷言；E2 斷言 `build-blogger.js` 原始碼不含 `includeFiltered` / `processMarkdownEntry`）。

> 註：preanalysis §8 forbidden 表列「改變 `load-posts.js`」為紅線，其載明理由為「draft 不得進正式 dist」。本改動為 additive + 預設關閉 + 不改 `classify`，正式 build 行為經 §7 byte-level 實測**未變**，故未觸及該理由所保護之不變式。此偏離已於此明列，供後續 review 對照。

---

## 7. 正式 build parity（本切片之必要 gate）

**方法**：pre/post 快照 byte 比對，於 scratchpad temp 目錄完成，未污染 source working tree 之正式 `dist-blogger/`（比對後已 **exact restore** 至 session 起始狀態，46 檔 sha256 全數相符）。

| 步驟 | 內容 |
| --- | --- |
| A | **改動前**（`22f1789`）先清 `posts/` `index/` `build-manifest.json` → `npm run build:blogger` → 快照 A（37 檔） |
| C | **改動後**（完整 change set，含 `load-posts.js`）同樣清空 → build → 快照 C（37 檔） |
| 比對 | 逐檔比對 A vs C |

**Normalization policy**：**唯一**正規化 = 各快照**自身 `build-manifest.json` 之 `buildAt` 精確字面值**（非 regex、非欄位白名單、非模糊比對）。每個快照只替換它自己那一個 ISO 字串 → 任何非時間戳差異**不可能**被遮蔽。若兩快照 `buildAt` 相同則工具直接 fatal（正規化將失去意義）。

**結果**：

```text
[1] artifact file list : A=37 B=37 — 相對路徑集合完全相同（含 paths / 目錄深度 / file types）
[2] per-file content   : raw byte-identical 8 / buildAt 正規化後相同 29 / REAL differences 0
[3] meta.json 結構     : 8/8 一致（slug / target path / published metadata / classification / asset refs）
[4] preview marker     : 正式產物 0 個 PREVIEW-ONLY / NOT FOR DEPLOY token
==== PARITY PASS (byte-identical modulo buildAt) ====
```

**第一個差異**：無（0 real differences）。

**工具自我驗證**：同一比對器先以「2026-07-08 之舊 `dist-blogger/` vs 快照 A」試跑 → 正確偵測到 **11 個真實差異**並指出第一個（`build-manifest.json` totals `scanned 21→20 / ready 9→8`，係 `what-is-design-token` redraft 所致）→ 證明比對器**不會**空洞通過。

---

## 8. Focused guard

```bash
npm run check:build-blogger-preview
```

**61 / 0 PASS**。全部斷言跑在 **OS temp** 之 synthetic fixture tree + temp output root，`finally{}` 清除；不寫 production content / dist / gh-pages；不需網路 / credential。

| 類別 | 覆蓋 |
| --- | --- |
| A. CLI 與參數（10） | missing / unknown / duplicate / malformed slug hard-fail；`--apply` / `--deploy` / `--publish` / `--push` / `--write` / `--force` / `--commit`（含 `=value` 形式）hard-fail；**不存在 output override**（`--output` / `--out-dir` hard-fail + 原始碼斷言 CLI 之 outputRoot 恆為 canonical default）；unknown-arg |
| B. Target classification（8） | draft accepted（且 frontmatter 未變）/ ready accepted / github-cross accepted / non-Blogger rejected / invalid frontmatter rejected / duplicate slug ambiguity rejected（`--site` 可消歧）/ **planner 與 builder eligibility 不得漂移**（sourceSite / mode / includes / reason / files / marker 逐項比對，含拒絕原因一致） |
| C. Artifact（19） | 路徑 `dist-blogger-preview/posts/<slug>/`；結構完整（3 檔齊全、無多餘檔、publish-checklist 不產）；PREVIEW-ONLY；NOT FOR DEPLOY；meta 機器可讀旗標；正式 dist 未建立/未修改；**renderer 實際共用**（產出 === banner + `renderBloggerPost()` 逐字重放）；renderer 非兩套；import 無 side effect（原始碼 + **子行程實測** ×2）；failure 不留半成品 ×2；atomic 落地；deterministic modulo builtAt；不執行 content-embedded script（EJS 注入不得被求值）；不讀 credential；不呼叫 network；不猜 Blogger 身分 |
| D. Output root 安全閘（7） | 拒 正式 dist-blogger（含子目錄）/ repo root / repo 外路徑 / deploy clone / 非絕對路徑 / repo 祖先 / 其他 dist；允許 canonical |
| E. Formal build parity（6） | preview marker 不滲入正式 build（JS 執行碼 + 所有 EJS 模板）；draft 不滲入正式 dist（正式 build 仍走 ready-only loader、不含 `includeFiltered` / `processMarkdownEntry` / planner）；`classify` 真實行為；**load-posts additive option 預設關閉**（預設路徑不組 entry；ready 文章兩種呼叫結果 JSON 相同）；package.json 註冊且未混入 readiness/release umbrella；.gitignore |

---

## 9. Phase A guard 之過期斷言修正

Phase A `check-blogger-preview-plan.js` 原有一條：

```js
assert.ok(!existsSync(path.join(REPO_ROOT, PREVIEW_DIST_REL)), '本切片不得建立 dist-blogger-preview/');
```

自 Phase C 起，`dist-blogger-preview/` 會因 `npm run build:blogger-preview` 而**合法存在**（gitignored 之本機產物）→ 該斷言將對任何跑過 preview build 的 operator 產生**假失敗**。

修正為其原本 intent（斷言名稱本即「**未被本 guard 建立**」）之正確表達：**planner 自身之 zero-write 不變式** —— 跑 planner 前後該路徑之存在性與內容清單完全不變。斷言數維持 **44 / 0**（一換一，非移除）。

---

## 10. 驗證結果（本輪實跑）

### 真實 repository content（read-only；canonical command）

| # | 情境 | slug | 結果 |
| --- | --- | --- | --- |
| 1 | 合法 **draft** Blogger target | `draft-book-review` | ✅ exit 0；產 3 檔；`officialBuild.includes=false (draft:true)`；**frontmatter 未變** |
| 2 | 合法 **ready** Blogger target | `after-work-writing-time-blocking` | ✅ exit 0；`officialBuild.includes=true (ok)` |
| 3 | **非 Blogger** target | `what-is-design-token`（`blogger.enabled: false`） | ✅ hard-fail exit 8 `not-a-blogger-target`；未產出 |
| 4 | 禁止參數 | `--apply` / `--deploy` / `--publish` / `--output` | ✅ 全 exit 2；未產出 |
| 5 | 未知 slug | `no-such-post` | ✅ exit 4 |
| 6 | 正式 `dist-blogger/` 未改變 | 42 檔 sha256 before/after | ✅ **IDENTICAL** |
| 7 | preview artifact 安全標記 | `post.html` / `copy-helper.txt` / `meta.json` | ✅ 三載體皆具 marker；`publish-checklist.txt` absent |

### Guards

| 指令 | pre-change | post-change |
| --- | --- | --- |
| `npm run check:blogger-preview-plan` | 44 / 0 | **44 / 0** |
| `npm run check:build-blogger-preview` | —（新增） | **61 / 0** |
| `npm run check:docs-node-script-refs` | 30/30 | **30/30** |
| `npm run check:docs-npm-run-refs` | 80/80 | **81/81**（+1；README 新增 canonical command，見 §11） |
| `npm run check:npm-script-targets` | 113/113 | **115/115**（+2；見 §11） |
| `npm run check:redraft-all` | docs-status 99/99 | **99/99** |
| `npm run validate:content` | 0 / 135 / 107 | **0 / 135 / 107** |
| `npm run check:phase1-readiness` | 16/16 | 見下 |

**`check:phase1-readiness`**：其 `github-pages-prepublish` 子檢查含 **working tree clean** 這道 deploy-readiness gate；在本切片 commit **之前**必然回報 `[FAIL] source: working tree clean — dirty entries: 8`（total=16 pass=15 fail=1）。此為預期之 uncommitted-work 假陽性，**非** regression：其餘 15 項全數 PASS，且六支子檢查（contract / npm-script-targets / adsense-mode / blogger-backfill / download-indexing / prepublish-smoke）**個別跑皆 exit 0**。commit 後 tree 回 clean 即恢復 16/16。

---

## 11. Assertion count delta

| Guard | 變化 | 原因 |
| --- | --- | --- |
| `check:npm-script-targets` | 113 → **115**（+2） | 新增 2 支 script target：`build:blogger-preview`、`check:build-blogger-preview`（各 +1；皆為直接 `.js` target） |
| `check:docs-npm-run-refs` | 80 → **81**（+1） | `README.md` 指令表新增 1 筆 occurrence：`npm run build:blogger-preview -- --slug=<slug>` —— 屬**必要 operator instruction**：本工具之 canonical 執行方式，且 README 指令表已逐項列出所有 `build:*`（`build:blogger` / `build:blogger-theme` / `build:promotion` / `build:sitemap`），漏列本指令會使 operator 找不到唯一的 draft 預覽入口。count 由 guard 實際掃描 occurrence 自動得出，**未手動指定、未為配合預測值而修改 guard** |
| `check:docs-node-script-refs` | 30 → **30**（0） | 未於 CLAUDE.md / README.md 新增 direct-node script 參照（兩支新 script 皆以 `npm run` 形式記錄） |
| `check:blogger-preview-plan` | 44 → **44**（0） | 一條過期斷言改寫為等價之 zero-write 不變式（一換一，見 §9） |

兩支 docs-refs guard 之掃描範圍皆為 `IN_SCOPE_DOCS = ['CLAUDE.md', 'README.md']`；`docs/**`（含本檔）不影響 count。

---

## 12. 本切片**未**做（維持 deferred / 禁止）

```text
F5 deferred
Blogger backfill intake candidate deferred
Blogger true-value intake deferred
production Blogger backfill deferred（check:blogger-backfill 維持 report-only）
production redraft deferred
production republish deferred
```

- ❌ 未 deploy / 未 push gh-pages / 未修改 deploy clone（僅 read-only 驗 baseline）
- ❌ 未登入 Blogger / 未呼叫 Blogger API / 未做 live Blogger Preview / 未建 Blogger draft / 未 update / 未 publish
- ❌ 未修改任何文章內容 / frontmatter / production `.publish.json` / status
- ❌ 未填入或猜測 `bloggerPostId` / `publishedUrl` / `publishedAt`
- ❌ 未安裝 dependency / 未動 lockfile / 未做全檔案 formatting / 未順手修 unrelated warning
- ❌ 未動 redraft / republish / backfill 工具
- ❌ 未動 `CLAUDE.md` 以外之 historical docs snapshot

---

## 13. 下一步（各須 Dean 明確授權）

1. **人工 Blogger Preview**（B2 之實際收益驗收）：跑 `npm run build:blogger-preview -- --slug=<draft-slug>` → 開 `dist-blogger-preview/posts/<slug>/post.html` → 複製 → Blogger 後台 HTML 模式貼上 → 存 draft → Blogger preview → 對照 `docs/20260710-blogger-preview-sanity-analysis.md` §5 之 40 項 sanity checklist。**本 Session 未執行**。
2. Runbook §D 之手動「改 ready → build → 改回 draft」流程是否正式改以本工具取代（需 Dean 實測後判定）。
3. Admin `#blogger-export` 是否顯示 preview 路徑（UI slice；須獨立 phase）。
4. `CLAUDE.md` §3a 之 minimal state sync（memory-sync / docs-only phase；不與本 source-only 切片混合）。

---

## See also

- `docs/20260710-blogger-preview-only-script-preanalysis.md`（B2 上位契約：§6.2 variant / §7 allowed / §8 forbidden / §9 gates / §11.2 acceptance）
- `docs/20260717-blogger-preview-plan-b2-phase-a.md`（Phase A：draft-aware target planner；本檔之 eligibility 單一事實來源）
- `docs/20260708-blogger-draft-preview-runbook.md`（手動 draft-preview 10 步；§D-4 / §D-10 之摩擦即本工具所解）
- `docs/20260710-blogger-preview-sanity-analysis.md` §5（preview sanity checklist 40 項；人工預覽對照）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md` §7（Option B 原始提案）
- `src/scripts/blogger-render.js` / `build-blogger.js` / `build-blogger-preview.js` / `blogger-preview-plan.js` / `load-posts.js`
- `CLAUDE.md` §23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（修改規則）、§29（第一版不做）
- `CLAUDE.md` §3a Red lines（不猜 Blogger ID / 不動 deploy / AdSense secret）

---

（本文件結束 / end of document）
