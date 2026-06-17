# Phase 2 ADMIN Write-Path Preanalysis（docs-only）

> Phase: `20260617-pm-phase2-admin-write-path-preanalysis-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only preanalysis**。唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md。
> Scope: BLOG 系統進入 **Phase 2 前置設計**。本 session 只做 ADMIN / write-path **preanalysis**，**不**做實作、**不**啟用任何寫入行為、**不** build / deploy / Blogger repost。
>
> ⚠️ 本文件**不是**新的 write-path 設計規格書，也**不是**實作核可。它是 Phase 1 closure 之後、Phase 2 入口的**重新錨定（re-anchor）**：把既有 write-path 設計 lineage 收斂成單頁，回答 Phase 2 是什麼、write-path 風險與保守落地順序，供 Dean 審閱後再決定是否開實作 phase。

---

## 1. Current baseline（phase 開始前）

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `4234752`（full `423475281cc9bb194053f7d9b3b82e8b3199b8b3`） |
| origin/main | `4234752` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(blog): record phase 1 closure checkpoint` |

→ Baseline 完全符合 frozen baseline `4234752`。未 pull / merge / reset / rebase / amend / force-push。

**Phase 1 closure checkpoint** 已 landed 於 `4234752`（`docs/20260617-blog-phase1-closure-checkpoint.md`）。本 phase 接續其 §5「Safe next options」之 "Phase 2 ADMIN / write-path preanalysis —— docs-only（不碰 source）" 路線。

Carry-forward acceptance numbers（**本 phase 不重跑**；僅引用 CLAUDE.md §3a validation baseline）：

- `validate:content` = 0 errors / 94 warnings / 84 issue-posts（production-post warnings = 0；94 全來自 `content/validation-fixtures/`）
- `safe-write:test` = 71 pass / 0 fail（carry-forward from `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`；本 phase 未跑）
- 其餘 guard（adsense / blogger-adsense-output / commerce / admin-governance / validation-report）皆 carry-forward green。

---

## 2. Why this is Phase 2, not Phase 1

| 判準 | 說明 |
| --- | --- |
| Phase 1 functionally complete | CLAUDE.md §28 MVP 17 條全達標；§29 第一版不做清單 12 項全維持為刻意 exclusions；Phase 0–9 主軸全 landed（`docs/20260617-blog-phase1-closure-checkpoint.md` §2）。 |
| write-path **不在** 第一版 MVP scope | §28 MVP 17 項皆為「讀取 / build / 匯出 / 追蹤」能力；無任一項要求 ADMIN 對 source content 之**寫入**。write / mutation 屬 §8 / §29 第二階段。 |
| ADMIN 屬 dev-mode-only 觀察工具 | ADMIN 不進 prod build / dist / deploy / noindex；其正當功能 = read-only 觀察、驗證輔助、治理可視化（`docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md` §F）。 |
| 本 doc 僅 preanalysis | 不是 implementation；不啟用寫入；不解開 browser → Node fs 通道。任何 write source 實作須另立 phase + Dean explicit approval。 |

**界線聲明**：本 doc **不**改寫、不降級 Phase 1 final history（2026-05-18，`docs/phase-1-completion-report.md`）。Phase 2 = post-Phase-1 強化線之一；write-path 受 §8 / §29 紅線約束，屬「第二階段需另開規格」之項目。

---

## 3. ADMIN state summary（2026-06-17 snapshot）

完整能力清單見 `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md` §C–§E。本節摘要 Phase 2 入口所需之「哪些已是 read-only / preview / dry-run、哪些已被接受、哪些仍是痛點」。

### 3.1 已落地能力之性質分層

| 性質 | 能力 | 寫入風險 |
| --- | --- | --- |
| **read-only display** | Posts index（7 欄 / search / filter / sort）；per-post detail（Identity / Routing / Dates / SEO / Blogger / GitHub / FB）；Categories & Tags governance；surface-card；governance signals + aggregation summary；validation report consume（four-state） | 🟢 零（無 fs.write） |
| **dry-run / preview** | SEO dry-run edit viewer（4 fields，client-side diff，無 Apply）；FB Sidecar Dry-run Editor（12 fields，client-side，**Apply 永久 disabled**）；sourceKey selector preview | 🟢 零（client-side only；無 fetch / 無 fs.write） |
| **CLI infra（landed-but-dormant）** | `src/scripts/safe-write.js` / `admin-write-cli.js` / `git-status-check.js` / `admin-field-validators.js` / `admin-write-whitelist.js` / `active-source-keys.js` + npm `safe-write:test` / `admin:write` | 🟡 **dormant**：CLI 存在但未接 browser；無 runtime production write 已執行；middleware 未開（`vite.config.js` 無 `configureServer` / `fs.writeFile` / `app.post`） |

### 3.2 已被接受（不重做）之 UI 區段

per checkpoint §J「不應重做的已完成項目」：R1 collapsible sections（browser PASS）、governance summary card、aggregation detail panel、posts-table `<td>` 7/7 closure、validation report consume、SEO dry-run collapse（`docs/20260617-admin-seo-dryrun-collapse-browser-pass-record.md`）、validator warning badge / state filter / categories-tags collapsible split / R3 health legend dedup（皆 2026-06-17 browser PASS）。

→ 上述任一**不得**在 Phase 2 被重新「實作 / 重做 / 重新規劃」。

### 3.3 已知剩餘痛點（與 write-path 相關者）

| 痛點 | 現況 | 與 write-path 關係 |
| --- | --- | --- |
| detail panel 仍長 | R1 已把 4 低頻區段收合；R2–R5 readability 仍 preanalysis-only、未授權 | 不阻擋 write-path；屬獨立 readability 線 |
| SEO dry-run 區塊 | 已改 native `<details>` 收合並 browser PASS | dry-run viewer 已是 write-path 之 stepping stone（見 §6 Option A） |
| relatedLinks / otherLinks 編輯 UI | **無**；只顯示 count | 屬 risky-editable 後段；Phase 2 首批不碰 |
| Apply / Save / Auto-fix | dormant；FB Apply 永久 disabled | Phase 2 write-path 之核心待決項 |
| per-post prescription（規則引擎「應改為 X」） | **未授權，永久紅線** | 明確排除於 Phase 2 |

---

## 4. Write-path problem definition

### 4.1 「write-path」在本專案的定義

**write-path** = 由 ADMIN / 本專案工具**主動對 source content 檔案做檔案系統層級之 mutation**（`fs.writeFile` / `fs.rename`），使作者不必純手動在 VS Code 編輯 frontmatter / sidecar。

它**不**包含：
- 既有 build pipeline 對 `dist/` 之產出（屬 build output，非 source mutation）。
- 既有 `npm run backfill:url` 對 `.publish.json` 之 CLI 回填（屬既有專用 helper，保留）。
- 任何 read-only 顯示 / dry-run 計算 / snippet 產生（見 §4.3 之區分）。

### 4.2 未來**可能**需要寫入的 targets（候選，非承諾）

per `docs/admin-2-write-pre-analysis.md` §4 欄位分級 + sidecar bundle 結構：

| target 類別 | 檔案 | 風險級 | Phase 2 首批是否考慮 |
| --- | --- | --- | --- |
| frontmatter / YAML safe fields（`description` / `searchDescription` / `titleEn` / `cover` / `coverAlt` / `updated` / `blocks.*` boolean） | `.md` | 🟢 低 | 候選首批（SEO 雙欄最小） |
| commerce links registry（`affiliate.blocks[]` / `links[].ref`） | `.md` frontmatter / `content/settings/commerce-links.json` | 🟡–🔴 | ❌ 不在首批（settings JSON 跨多文章影響） |
| related links / books / hashtags（`relatedLinks[]` / `otherLinks[]` / `book.*`） | `.md` | 🔴 array/nested schema | ❌ 不在首批 |
| Blogger repost packet metadata（`blogger.publishedUrl` / `publishedAt` / `bloggerPostId`） | `.publish.json` | 🟡 | ❌ 用既有 `backfill:url`，不走新 write UI |
| GA4 / SEO config fields | `content/settings/*.json` | 🔴 全站 config | ❌ 永不走 per-post write UI |
| FB promotion sidecar（`enabled` / `hashtags` / body） | `.fb.md` | 🟢–🟡 | ⏸ dormant；待 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 preflight |

### 4.3 「snippet generation」vs「actual file mutation」（關鍵區分）

| 維度 | snippet generation（已部分存在 / 低風險） | actual file mutation（高風險 / 須 gate） |
| --- | --- | --- |
| 行為 | 算出新值 / 產生可複製之 YAML / markdown snippet，**由 Dean 手動貼回** | 由工具直接 `fs.writeFile` 覆寫 source 檔 |
| fs 副作用 | 無（或只寫 `.cache/` 內非 source 之 payload file） | 有（mutate git working tree 內 source content） |
| rollback | 不需（未動 source） | 需（`git restore`） |
| 既有實例 | SEO dry-run viewer、FB dry-run editor、commerce copyable YAML snippet（`docs/20260608-commerce-admin-copyable-yaml-snippet-preanalysis.md`） | CLI `admin:write --apply`（dormant；未對 production 執行過） |
| Phase 2 偏好 | ✅ 優先；零 / 極低風險 | 🟡 僅在 snippet 路線驗證充分後、且 Dean explicit approval 才考慮 |

→ **Phase 2 之保守核心**：能用 snippet generation 解決的，不開 actual file mutation。actual mutation 只在 snippet 路線不足、且每次 Dean explicit approval 下才逐欄、逐檔、dry-run-first 推進。

---

## 5. Risk map

| 風險 | 說明 | 既有 mitigation（已 landed 或已設計） |
| --- | --- | --- |
| **data loss** | 覆寫覆蓋既有內容；partial write 造成不一致 | atomic temp + rename（`safe-write.js`）；拒絕直接覆寫策略 A；git working tree 即 backup |
| **malformed frontmatter** | YAML 縮排 / 引號 / multiline；`matter.stringify` 對 nested object（`book.authors[]` / `affiliate.links[]` / `images[]`）誤改非目標欄位 | pre-write inline validator；post-write `validate:content`；dry-run byte-diff 對照（`docs/...phase-4p5...` §9.3 之 byte-exact acceptance gate） |
| **accidental publish / repost** | 寫入誤觸 deploy / Blogger repost | write-path 與 build / deploy / repost **完全解耦**；CLI 不 spawn build / git commit / push；status `published` 文章首期禁寫 |
| **dirty tree** | 在未 commit 之 working tree 上寫入，混淆 diff / 難 rollback | pre-write `git status` clean enforce（`git-status-check.js`）；dirty 時拒絕或要求 Dean 明示 |
| **content validation 退步** | 寫入後 warning / error 增加 | post-write spawn `validate:content`；regression → exit 9 + rollback hint；不自動 rollback |
| **Windows path / encoding** | 跨 drive rename 非 atomic；PowerShell quote escape；UTF-8 BOM | whitelist 拒跨 drive；payload file（JSON）sidestep shell quote；UTF-8 明示 |
| **one-person operator safety** | Dean 單人操作；無 reviewer 把關 | dry-run-first；explicit `--apply`；每批 stop point；commit 由 Dean 手動 |
| **rollback requirement** | 任何 mutation 須可逆 | 唯一回退機制 = `git restore <file>`（拒 `.bak` 策略）；CLI 不自動 commit/push，保留 working-tree-level 可逆性 |

---

## 6. Candidate architecture options

> 多數選項在 `docs/admin-2-write-pre-analysis.md` / `docs/20260528-admin-write-phase-4-middleware-preanalysis.md` / `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md` 已有深入分析。本節以 Phase 2 入口角度重列 5 個 architecture-level 選項（與既有 doc 之 Strategy A–F 為不同層級：此處談「寫入發生在哪個 surface」）。

### Option A：keep ADMIN read-only；只匯出可複製 YAML / markdown snippet

| 維度 | 評估 |
| --- | --- |
| pros | 零 fs.write 風險；零新 surface；沿用既有 dry-run / snippet UI；無 rollback 需求；對單人操作最安全 |
| cons | Dean 仍須手動貼回；無自動化省力 |
| risk | 🟢 最低 |
| testability | 🟢 高（純 render；無 fs 副作用；可純 grep rendered HTML 驗證） |

### Option B：local write-CLI，由 Dean 在 terminal 手動 invoke

| 維度 | 評估 |
| --- | --- |
| pros | 繞過 browser → fs 通道（無 HTTP / CSRF / LAN exposure）；首次寫入發生在可觀察 terminal；infra（`admin-write-cli.js`）**已 landed**、dry-run-capable；payload file sidestep shell quote |
| cons | 非 GUI；Dean 須記 CLI 用法；現為 dormant，啟用須 acceptance |
| risk | 🟡 中（首次對 production content 實寫之 YAML emitter 風險集中於此，可被 dry-run 隔離驗證） |
| testability | 🟢 高（`safe-write:test` 71 cases；CLI stdout JSON deterministic；可 dry-run 對多篇 production `.md` 驗 byte-diff） |

### Option C：local middleware / localhost write service（Vite `configureServer`）

| 維度 | 評估 |
| --- | --- |
| pros | ADMIN UI 可直接 Apply；UX 最順 |
| cons | 首次解開 browser → Node fs 通道；新 HTTP surface（CSRF / origin / Referer / LAN exposure / prod build leakage / path traversal）；mitigation 成本高 |
| risk | 🔴 高（兩條風險面——HTTP surface + production 實寫——若與 CLI 同時引入會難 localise root cause） |
| testability | 🟡 中（需 endpoint acceptance test；surface 多） |

### Option D：GitHub-based edit flow / PR-like flow

| 維度 | 評估 |
| --- | --- |
| pros | 天然 diff review + rollback（PR / commit）；不需本機 write service |
| cons | 與「本機資料夾型 CMS」核心理念偏離；對單人 + 過渡期過重；引入 GitHub API 風險（§29 第一版禁 API 自動化） |
| risk | 🟡 中（流程重；與系統定位不符） |
| testability | 🟡 中（依賴 GitHub 外部狀態） |

### Option E：hybrid staged queue —— 僅在 explicit Apply + diff review 後才寫

| 維度 | 評估 |
| --- | --- |
| pros | 結合 dry-run preview + explicit Apply + diff gate；可疊在 Option B（CLI）之上作為 UX 層 |
| cons | 比 Option A/B 多狀態（staged queue）；複雜度上升 |
| risk | 🟡 中（取決於底層是 CLI 還是 middleware） |
| testability | 🟢 高（每步可獨立驗證 staged state → diff → apply） |

---

## 7. Recommended conservative path

**偏好 staged / reversible / explicit-approval workflow**，且優先 snippet generation 而非 actual mutation。

### 7.1 建議順序（每步之間皆 stop point；無鏈式啟動）

1. **docs-only design**（= 本 doc + 後續若需之設計 phase；零 source）
2. **fixture / test 先行**（在任何 production write 之前，先補 / 確認 fixture 覆蓋；`safe-write:test` 維持 green）
3. **admin export packet**（強化 Option A snippet：把 safe-editable 欄位之可複製 YAML snippet 補齊；零 fs.write）
4. **local write CLI dry-run**（啟用 Option B 之 dry-run 對多篇 production `.md` 驗 byte-diff；**不** `--apply`）
5. **local write CLI actual write，behind explicit flag**（首批限 SEO `description` / `searchDescription` 雙欄、draft/ready 文章、單檔單欄；`--apply` 顯式；dry-run-first）
6. **validation gate**（每次 actual write 後 post-write `validate:content`；regression → 提示 rollback）
7. **commit only after Dean review**（CLI 不自動 commit / push；Dean 看 `git diff` 後手動 commit）

### 7.2 evidence 要求（本 preanalysis 階段）

- ❌ **不**需 browser / backend evidence（本 doc 為 preanalysis）。
- ❌ **不**需 Blogger / GA4 / AdSense evidence。
- ❌ 本 phase **無** source implementation。

---

## 8. Proposed acceptance gates for future implementation

未來任一 write-path implementation phase（須另立 + Dean explicit approval）建議套用以下 gate：

1. **zero source change before design accepted** —— 設計未經 Dean 簽收前不動 source。
2. **fixture coverage before real content write** —— 真實 content 寫入前須有 fixture 覆蓋；`safe-write:test` green。
3. **dry-run diff before actual write** —— 每次實寫前先 dry-run，Dean 看 diff。
4. **backup or restore point before mutation** —— working tree clean（git 即 restore point）；dirty 時拒寫。
5. **validation pass before commit** —— post-write `validate:content` 不退步才 commit。
6. **dirty tree detection** —— pre-write `git status` clean enforce。
7. **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦；CLI 不 spawn 之。
8. **explicit Dean approval before every write** —— 每次 actual write 前皆須 Dean 明示；無 auto-write / 無 implicit save-on-blur。

---

## 9. Recommended next phase after this doc

| 候選 | 性質 | 是否需 Dean approval |
| --- | --- | --- |
| **保守（推薦）**：Phase 2 ADMIN write-path **design acceptance（read-only）** —— Dean 審閱本 doc，確認方向 / 偏好 Option（建議 A→B 漸進） | docs / decision only | ✅ |
| 次選：admin-write **fixture / preflight docs-only** —— 在實作前補 fixture plan / preflight checklist（不動 production） | docs-only | ✅ |
| **不做（除非 Dean explicit approve）**：任何 write source 實作（CLI actual write / middleware / Apply 啟用） | implementation | ✅✅（每次 write 皆須） |

→ **預設下一步 = idle / 等 Dean 審閱本 doc**；不主動進入 implementation。

---

## 10. Guardrails（本 phase 明確不做）

- ❌ 不修改 source / content / settings / views / scripts / package / lockfile。
- ❌ 不修改 dist / dist-blogger / dist-promotion / gh-pages / `.cache`。
- ❌ 不修改 CLAUDE.md / MEMORY.md。
- ❌ 不 build / deploy / Blogger repost。
- ❌ 不實作 write-path；不啟用 Admin 寫檔；不解開 browser → Node fs 通道。
- ❌ 不新增 API server / middleware / CLI（既有 dormant infra 維持 dormant，不啟用）。
- ❌ 不新增 npm dependency。
- ❌ 不 npm install / 不重跑 validate / guards（baseline carry-forward）。
- ❌ 不 merge / rebase / reset / amend / force-push。
- ❌ 不啟動任何 write behavior；本 doc 不要求 Blogger / GA4 / AdSense evidence。
- ❌ 不重做 ADMIN checkpoint §J 之已完成項目。
- ❌ 不自行開下一個 implementation phase。

唯一 mutation = 本 doc（`docs/20260617-phase2-admin-write-path-preanalysis.md`）新增。

---

## 11. Cross-links

- `docs/20260617-blog-phase1-closure-checkpoint.md`（Phase 1 closure；本 phase 之前置）
- `docs/admin-2-write-pre-analysis.md`（write surface inventory / 欄位分級 / Strategy A–F / sub-batch 順序）
- `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md`（dry-run UI）
- `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（middleware surface / security boundary）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver；payload schema / exit codes / byte-exact gate）
- `docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md`（YAML emitter drift mitigation）
- `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`（ADMIN 能力清單 §C–§E + 不重做清單 §J）
- `docs/fb-sidecar-write-safety.md` / `docs/fb-sidecar-write-preflight-decision.md`（FB sidecar 真實寫入之 dormant gate）
- `CLAUDE.md` §8 / §28 / §29（第二階段 / MVP 必做 / 第一版不做清單）

---

## 12. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `4234752` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-write-path-preanalysis.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| 未啟用任何 write behavior / 未新增 API server / middleware / CLI / npm dep | ✅ |
| 未 build / deploy / repost / npm install / merge / rebase / reset / amend / force-push | ✅ |
| 未要求 Blogger / GA4 / AdSense evidence | ✅ |

→ docs-only preanalysis，acceptance trivially PASS。

---

（本文件結束）
