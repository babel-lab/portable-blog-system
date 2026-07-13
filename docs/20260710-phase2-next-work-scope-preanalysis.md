# BLOG Phase 2 next-work-scope planning preanalysis（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 最後對齊：2026-07-13（Asia/Taipei）— docs-only state reconciliation slice；見下方 §0.5 Status update（2026-07-13）
- 類型：docs-only **Phase 2 work-package planning preanalysis**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：於 Phase 1 RC 已穩定（見 `docs/20260710-phase1-rc-docs-index.md`）、且 `docs/20260710-phase1-rc-next-phase-route-selection.md`（A–G routes）已 landed 之後，把「Phase 2 / next-phase 之後真正可挑選之工作包」拆成**細顆粒 work packages**（WP-01 … WP-20），讓 Dean 於下一 session 可**明確選一個 WP** 進入（而非停在 route 層之高階分類）。**不**啟動任一 WP、**不**代 Dean 選 WP、**不**排 WP 之間 preferred order；只提供結構化 lookup。
- 觸發：`docs/20260710-phase1-rc-next-phase-route-selection.md` §3 Route B（Phase 2 next-work-scope planning）+ 本 session Dean 明確指示執行 Route B。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**買網域 / **不**設 DNS / **不**建 `CNAME` / **不**建 `ads.txt` / **不**啟用 AdSense / **不**改 AdSense production behavior / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` / `package-lock.json`。
- 本輪允許 mutation：新增本檔（唯一）+ commit + push origin/main。

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `ca9e94f` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash = `ca9e94f1023259f8845126c53af6cb9da19fd1e8`；subject `docs(phase1): analyze next phase routes`（前一 session 落地之 route selection doc；`docs/20260710-phase1-rc-next-phase-route-selection.md` 為當時 unique mutation）。前 4 commit：`a52ff4c`（`docs(state): add phase1 rc docs index`）→ `abc707c`（`docs(blogger): record preview-only helper preanalysis`）→ `c0ee384`（`docs(release): define domain adsense gates`）→ `e477a75`（`docs(blogger): record backfill write preflight`）→ `a9003e8`（`docs(state): record phase1 rc next readiness`）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone）。

Readiness checks 本輪已跑（read-only；exit 0）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode-metadata scanned 17 / warnings 0、blogger-backfill scanned 12 / candidates 7 / complete 0 / missing 7 report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（1 parseable + 1 script-present + 6 required + 13 forbidden absent + 1 ordered 6/6） |

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動；`.git/index.lock` 皆 absent。

**Previous session 截斷資訊補確認**：

- 上一 session commit `ca9e94f` 之完整 subject 已由本 session 直接 `git log -1 --oneline` 復核 = `docs(phase1): analyze next phase routes`。
- 上一 session 新增之 docs 檔完整檔名 = `docs/20260710-phase1-rc-next-phase-route-selection.md`（`git show --name-only` 顯示 `ca9e94f` 唯一 mutation）。
- 上一 session 未動 program / content / frontmatter / sidecar / settings / views / scripts / package.json / lockfile / dist / gh-pages / CLAUDE.md / MEMORY.md / memory；符合上一 session 之 docs-only 契約。

---

## 0.5 Status update（2026-07-13；docs-only state reconciliation）

本 doc 於 2026-07-10 landing 時，WP-01 rehearsal template / WP-02 intake / WP-05 B1 navigator 皆為未來候選。2026-07-10 至 2026-07-12 期間，Dean 於獨立 phases 中各自 explicit approval 後，數個 WP 之準備工作 / helper 實作已 landed。為避免未來 session 誤把「已完成之準備工作」再度提為新的 entry candidate，本 §0.5 補一份**狀態對齊表**；`§1` / `§4` / `§5` / `§7` 之對應段落已同步更新，並保留原始欄位以便歷史對照。

**本 §0.5 為 additive-only docs update；不改任何契約 / 不新增規則 / 不移除任何 red-line / 不宣告新 PASS / 不代 Dean 決策 / 不啟動任一 WP**。

| WP | 原分類 | 目前實際狀態 | 依據（commit / doc / guard） |
| --- | --- | --- | --- |
| **WP-01** — Blogger backfill write-phase rehearsal（docs-only） | P2-Entry candidate | ✅ **LANDED** | `f1aec08` `docs/20260710-blogger-backfill-write-rehearsal-template.md` + 相關 `5c92d15` `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md` + `b0b0488` `src/scripts/check-blogger-backfill-one-post.js` + `260dd1b` `src/scripts/check-blogger-backfill-write-rehearsal-template-contract.js`；`package.json` 新增 `check:blogger-backfill:one-post` / `check:blogger-backfill:write-rehearsal-template-contract` |
| **WP-02** — Blogger backfill write 1 篇 sidecar 之**準備工作** | P2-Entry candidate（1 篇 sidecar write） | ✅ **PREPARATION LANDED** | `631ba5c` `docs/20260710-blogger-backfill-wp02-intake-template.md` + `79dec13` `docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md` + `e61730e` `docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md` + guards `8fe2cac` / `97ea33b` / `ad32119`（`check:blogger-backfill:wp02-intake-contract` / `one-post-worksheet-contract` / `wp02-one-post-consistency-contract`） |
| **WP-02** — Blogger backfill write 1 篇 sidecar 之**實寫入** | P2-Entry candidate | ⏸ **WAITING FOR DEAN INPUT** — Dean 尚未於任何 session 中提供 real `publishedUrl` / `publishedAt`；`check:blogger-backfill` 目前 candidates 7 / complete 0 / missing 7 / report-only；write phase 仍需 Dean explicit approval + real Blogger 後台真值 | 「不猜」policy 由 `docs/20260706-blogger-identity-and-backfill-strategy.md` 保護；write target canonical location = `.publish.json` sidecar per `docs/20260706-blogger-backfill-write-target-inventory.md`；不啟動 |
| **WP-05** — Blogger preview helper B1 navigator（read-only） | P2-Entry candidate | ✅ **LANDED**（2026-07-12） | `cc6497b` `src/scripts/check-blogger-preview.js` + `cae3123` operationalize + `1ea5d58` `docs/20260712-blogger-preview-b1-one-post-operational-rehearsal.md` + `53cc20d` `docs/20260712-blogger-b1-live-manual-preview-test-we-media-myself2.md`；`package.json` 新增 `check:blogger-preview` + `check:blogger-preview-smoke`；`docs/20260712-preview-only-helper-implementation.md` |
| **WP-06** — Blogger preview helper B2 draft-aware preview build | Deferred until Dean signal | ⏸ **NOT STARTED / DEAN-GATED** — `dist-blogger-preview/` 尚未建立 / `.gitignore` 尚未動 / 無 PREVIEW-ONLY marker | `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 / §13；未啟動 |
| **WP-12** — Download next-phase preanalysis（docs-only） | Analytical only（原 §1B 第 4 類） | ✅ **PREANALYSIS LANDED**（2026-07-13） | `docs/20260713-wp12-download-next-phase-preanalysis.md`（Pattern A / B 收攏 + indexing 獨立性紅線 + 既有 schema mapping + follow-up A–I 拆解 + decision matrix）；**不**改 source / content / schema / guard / red-line；follow-up A..I 全數仍 Dean-gated |

**其他 out-of-scope 但已 landed 之 additive slice（非 WP-01..WP-20 原 catalog 之項目，僅資訊記錄；未來 route/WP recommendation 不再列為 entry candidate）**：

| Slice | 狀態 | 依據 |
| --- | --- | --- |
| Download page indexing decoupling（Phase 1 `check:phase1-readiness` umbrella 新增 `check:download-indexing-independence`；download page 生成輸出 contract；temp-build smoke） | ✅ landed；已納 metadata / phase1-readiness umbrella | `7cbb278` / `2d1b462` / `9304e50` / `624d74b` / `88190cd`；`docs/20260712-download-page-indexing-independence-policy-lock.md` / `docs/20260712-download-indexing-guard-phase1-umbrella-integration.md` / `docs/20260712-download-indexing-guard-metadata-umbrella-integration.md` / `docs/20260712-download-page-generated-output-contract.md` / `docs/20260712-download-page-temp-build-smoke.md` |
| Shared author byline contract（validator / renderer / test coverage 3 slices） | ✅ landed；已達合理停止點（Layer 1 5/5、Layer 2 production scanned 17 warnings 0、Layer 3 10/10）；**不**再擴充微型 assertion / **不**接入 readiness umbrella / **不**新增作者頁或作者系統 | `9cb38a1` / `796ee5a` / `0b87aae` / `f944ff7`；`docs/20260712-shared-author-byline-contract.md`；`package.json` `check:byline-contract` |

**Recommendation post-2026-07-13**：本 §0.5 landing 之後，**Recommendation 仍 = remain idle freeze**（沿用 §9）；如 Dean 於未來 session 明確判斷推進，唯一仍屬「小切片 entry candidate」之未動 WP 為 **WP-11**（overflow observation；僅在觸發條件命中時）／ **WP-14**（custom domain Gate D prep-1 docs-only）／ **WP-16**（AdSense Gate A prep-1 docs-only）／ **WP-07**（GA4 P2/P3 dimension 觀察）；已完成之 WP-01 / WP-05 / WP-12 preanalysis 不再列為 entry candidate（WP-12 之 follow-up A–I 仍各自 Dean-gated）。**WP-02 實寫入仍為主要 medium-scope 待啟動**，但 gate 為 Dean 提供 real Blogger 值 + explicit approval，非 idle-freeze 可自動推進之項目。

---

## 1. 結論（先講結果）

**A. 本 doc 拆出 20 個 Phase 2 work packages（WP-01 … WP-20）**。每個 WP 皆有固定欄位：goal / trigger condition / allowed work / forbidden work / required Dean approval / required input data / touches（code / content / sidecar / deploy / external）/ risk level / suggested first slice / required checks。此拆分為 route selection doc（`docs/20260710-phase1-rc-next-phase-route-selection.md`）§3 之**下一層深化**：route level = A–G；WP level = 每個 route 內可獨立啟動之最小切片。

**B. 20 個 WP 分四類**（reconciled 2026-07-13；見 §0.5）：

0. **Completed since original doc（2026-07-10..07-12）**：
   - WP-01（Blogger backfill write-phase rehearsal docs-only）= ✅ **LANDED**（`f1aec08` rehearsal template + `5c92d15` one-post worksheet + `b0b0488` one-post dry-run script + `260dd1b` rehearsal template contract guard）
   - WP-02 **準備工作**（intake template / seven-candidate dry-run report / true-value intake packet / 3 支 WP-02 相關 contract guards）= ✅ **LANDED**（`631ba5c` / `79dec13` / `e61730e` / `8fe2cac` / `97ea33b` / `ad32119`）；**注意** WP-02 之實寫入仍屬第 1 類 waiting-for-Dean-input
   - WP-05（Blogger preview helper B1 navigator, read-only）= ✅ **LANDED**（`cc6497b` navigator + `cae3123` operationalize + `1ea5d58` rehearsal doc + `53cc20d` manual preview doc）
1. **P2-Entry candidates**（適合作 Phase 2 第一個安全小切片；docs-only 或極小 scope）：~~WP-01~~（✅ landed，移到第 0 類）／ WP-02 **實寫入**（Blogger backfill write 1 篇 sidecar；準備工作已完成、waiting for Dean to provide real `publishedUrl` / `publishedAt`）／ ~~WP-05~~（✅ landed，移到第 0 類）／ WP-11（Blogger live overflow observation，docs-only；僅觸發時）／ WP-14（custom domain prep-1 docs-only）／ WP-16（AdSense prep-1 docs-only）。
2. **Deferred until Dean signal**（需 Dean 提供外部資料 / 判斷時機）：WP-03（backfill remaining 篇目 rollout）／ WP-06（Preview helper B2 draft-aware build）／ WP-08（Second GitHub Pages deploy 1 篇）／ WP-15（Gate D DNS / CNAME 落地）／ WP-17（Gate A pub id 落地 / ads.txt）／ WP-18（Blogger AdSense Batch 2 P2 live repost）／ WP-19（Reverse UTM pm-26 deploy）／ WP-20（Admin richer fields / ready option）。
3. **Blocked / dormant / red-line**（第一版永禁或明確 dormant；本 doc 不放路徑）：WP-04（Admin write path Apply / middleware / admin-write-cli）／ WP-09（FB sidecar 真實寫入）／ WP-10（Commerce L2 / L3 / L4 新 candidates）／ WP-13（`github-pages-blog-planning` quarantine 解除）。
4. **Analytical only**（純觀察 / 情報收集；不進系統實作）：WP-07（GA4 P2 / P3 dimension 觀察）／ WP-12（Download Admin picker / renderer / Forms 串接 preanalysis）。

**C. Recommended P2-entry candidates**：本 doc **不排** WP-01 / 02 / 05 / 11 / 14 / 16 之間 preferred order，改依 Dean 目標分岔（見 §5）：

- 若 Dean 目標 = 「先讓 Blogger 生態穩定收斂 backfill」→ 傾向 WP-01（docs-only rehearsal）或 WP-02（1 篇 sidecar write）。
- 若 Dean 目標 = 「累積內容 / 觀察 SEO 到啟動 domain」→ 傾向 WP-14（domain prep docs-only）。
- 若 Dean 目標 = 「AdSense 資產先鋪」→ 傾向 WP-16（AdSense prep docs-only）。
- 若 Dean 目標 = 「Blogger 手動流程繁瑣度需改善」→ 傾向 WP-05（B1 navigator）。
- 若 Blogger 實機發布頁再現水平捲軸 → 觸發 WP-11。

**D. Recommendation = remain idle freeze**（沿用 `CLAUDE.md` §3a Recommended next paths；route selection doc §8；docs-index §11）。本 doc **不**啟動任一 WP、**不**代 Dean 選 WP；若 Dean 未來 session 明確指示，本 doc 為 lookup 入口。

---

## 2. Relationship to Phase 1 RC

本 doc 屬 Phase 1 RC docs family 之**外圍延伸**（route selection 之下一層 planning），不 downgrade / 不 re-封存 Phase 1 RC，也不擴大 RC baseline scope。定位關係：

```
CLAUDE.md §3a                             ← 上位契約 / red lines
    │
    ├── Phase 1 RC 2026-07-10 family（8 docs + route selection 為第 9 份）
    │      ├─ handoff readout                 ← operating readout
    │      ├─ workflow alignment              ← Admin export / Blogger preview sanity / preview helper preanalysis
    │      ├─ gate / preflight                ← next-readiness / backfill preflight / domain·AdSense gates
    │      └─ docs single-page lookup index   ← discovery
    │
    ├── Route selection preanalysis（Routes A–G；高階分類）
    │
    └── 本 doc: Phase 2 work packages（WP-01 … WP-20；細顆粒；為 Route B 之落地）
```

**本 doc 邊界**：

- 本 doc **不**是「Phase 2 kickoff」；Phase 2 kickoff 之定義（如新開一份 `phase-2-completion-checklist.md`、reset `CLAUDE.md` §3a 為 Phase 2 current state 等）屬另一獨立 phase，且需 Dean 明說啟動。
- 本 doc **不**新增 red-line；沿用 `CLAUDE.md` §3a Red lines + route selection §6。
- 本 doc **不**新增 gate；沿用 handoff readout §5.3 + docs-index §7。
- 本 doc **不**新增 acceptance criteria；沿用各 WP 對應之既有 preflight / preanalysis doc。

---

## 3. Source documents read（本 session）

以下 docs 於本 session 已 read（read-only；未修改）：

| # | Path | 讀取目的 |
| --- | --- | --- |
| 1 | `CLAUDE.md` | 契約 / red lines / Phase 1 current state / Recommended next paths |
| 2 | `docs/20260710-phase1-rc-docs-index.md` | 2026-07-10 家族 8 份 lookup + baseline / blocked / approval / next path |
| 3 | `docs/20260710-phase1-rc-next-phase-route-selection.md`（`ca9e94f` 唯一新增檔） | Routes A–G scope / trigger / allowed / forbidden / approval / input / risk / first slice / checks |
| 4 | `docs/20260710-phase1-rc-next-readiness-analysis.md` | RC readiness re-verify + 三份 workflow docs 影響面 audit |
| 5 | `docs/20260710-blogger-preview-only-script-preanalysis.md` | B1 navigator / B2 draft-aware preview build preanalysis |
| 6 | `docs/20260710-blogger-backfill-write-phase-preflight.md` | Blogger backfill write phase preflight（不實寫；資料需求 / gates / dry-run / rollback） |
| 7 | `docs/20260710-custom-domain-adsense-trigger-checklist.md` | custom domain Gate D + AdSense Gate A trigger + 未來 sequence |
| 8 | `docs/20260709-blog-phase2-next-work-packet.md` | Phase 2 next-work packet 之候選 1–5（handoff / route selection / backfill / overflow / preview-only preanalysis）|

其他既有 preflight / policy 文件已由上述文件透過 See also 引用，本 doc **不**再重讀原文；引用位置以既有 doc 之 §-anchor 為準。

---

## 4. Phase 2 candidate work packages（WP-01 … WP-20）

每 WP 固定欄位如下（不齊全處以「—」表示）。**本 doc 不啟動任一 WP、不代 Dean 選、不排 WP 之間 preferred order**（除 §5 依 Dean 目標分岔之建議）。

### WP-01 — Blogger backfill write-phase rehearsal（docs-only；含 dry-run runbook / rollback drill）

> **Status update（2026-07-13）**：✅ **LANDED**。Rehearsal template = `docs/20260710-blogger-backfill-write-rehearsal-template.md`（commit `f1aec08`）；one-post dry-run worksheet = `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md`（`5c92d15`）；one-post dry-run helper script = `src/scripts/check-blogger-backfill-one-post.js`（`b0b0488`；registered as `check:blogger-backfill:one-post`）；rehearsal template contract guard = `src/scripts/check-blogger-backfill-write-rehearsal-template-contract.js`（`260dd1b`；registered as `check:blogger-backfill:write-rehearsal-template-contract`）。原本欄位保留為完整 WP spec；未來 Route B / Route C 啟動時**不再將 WP-01 列為新的 entry candidate**。若需再拉一份 rehearsal doc，屬 refresh phase、須 Dean explicit approval + 另開 phase。

- **Goal**：於 `docs/20260710-blogger-backfill-write-phase-preflight.md` 既有 preflight 之上，追加一份 write-phase rehearsal doc：明列 sidecar write 之逐項步驟（先於 sandbox / 假路徑），並模擬 rollback；**不**寫任何真值。
- **Trigger condition**：Dean 想先把 write-phase 流程 rehearsal 過再實寫；或 Dean 尚未取得真值但想穩定 write-phase 之 acceptance / rollback 細節。
- **Allowed work**：新增 `docs/<YYYYMMDD>-blogger-backfill-write-phase-rehearsal.md`（docs-only；additive-only）。
- **Forbidden work**：❌ 動 `.publish.json` sidecar / frontmatter blogger block；❌ 動 script / build / deploy；❌ 猜任何 Blogger values；❌ 動 Blogger 後台。
- **Required Dean approval**：「請進入 backfill write-phase rehearsal phase（docs-only）」。
- **Required input data**：無（不需真值；只是 rehearsal）。
- **Touches**：docs only（無 code / content / sidecar / deploy / external）。
- **Risk level**：極低（純 docs）。
- **Suggested first slice**：新增一份 rehearsal doc，明列每篇候選之 sidecar write 步驟 / dry-run 模擬 / rollback 命令 / acceptance ticks；不動任何 sidecar。
- **Required checks**：`git status --short` 只顯示新增 doc；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22。

### WP-02 — Blogger backfill write 1 篇 sidecar（真值寫入）

> **Status update（2026-07-13）**：⚠️ **PREPARATION LANDED / WRITE STILL DEAN-GATED**。所有 write-phase 前置準備均已 landed：
> - `docs/20260710-blogger-backfill-wp02-intake-template.md`（`631ba5c`；WP-02 intake template）
> - `docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md`（`79dec13`；七篇 backfill dry-run 報告）
> - `docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md`（`e61730e`；WP-02 true-value intake packet）
> - guard `check:blogger-backfill:wp02-intake-contract`（`8fe2cac`）
> - guard `check:blogger-backfill:one-post-worksheet-contract`（`97ea33b`）
> - guard `check:blogger-backfill:wp02-one-post-consistency-contract`（`ad32119`）
>
> **實寫入尚未執行**：`.publish.json` sidecar 未動；`check:blogger-backfill` 仍 candidates 7 / complete 0 / missing 7（report-only）；`bloggerPostId` 屬系統欄位不列必填、per identity policy。啟動條件不變：Dean 於 approval 中明列篇目 + 提供 real `publishedUrl` / `publishedAt`（+ optional `note`）。Claude 不主動啟動、不猜任何 Blogger 值、不從既有 metadata 推導 Blogger internal ID。

- **Goal**：對 1 篇候選（例如 `we-media-myself2`，只缺 `bloggerPostId`；或 P3 `blog-restart-steady-rhythm-notes` 已 live verified）寫入 sidecar `.publish.json` 真值。
- **Trigger condition**：Dean 於 approval 中明列篇目 + 提供 real `publishedUrl` / `publishedAt`（+ optional `note`；`bloggerPostId` 不列必填、per identity policy）。
- **Allowed work**：改動指定 1 篇之 `.publish.json`（canonical location；per `docs/20260706-blogger-backfill-write-target-inventory.md`）；跑 `check:blogger-backfill` / `validate:content` / `check:phase1-readiness`。
- **Forbidden work**：❌ 猜任何 Blogger values；❌ 動 `.md` frontmatter blogger block（legacy fallback；不建議寫入）；❌ 動 Blogger 後台；❌ 動 script；❌ 動其他 candidate；❌ 升 `check:blogger-backfill` fail-fast；❌ deploy / push gh-pages。
- **Required Dean approval**：「請進入 Blogger backfill write phase 第 1 篇；篇目 = <明列>；附 Dean 提供之 publishedUrl / publishedAt / optional note 真值」。若涉及 sidecar-absent 篇目，Dean 需於同 approval 中明示 permalink（per preflight §5 / §8）。
- **Required input data**：real `publishedUrl`（`https://<blogger-domain>/YYYY/MM/<slug>.html`）；real `publishedAt`（ISO 8601 或 Blogger 後台 timestamp）；optional `note`；**不列** `bloggerPostId`。
- **Touches**：content sidecar（1 篇之 `.publish.json`）。No code / no frontmatter / no deploy / no external.
- **Risk level**：中（write path 首次觸發於本 WP；寫錯需 rollback）。
- **Suggested first slice**：只寫 1 篇；依 preflight §7 acceptance 逐項對照；下一篇需 Dean 另行 approval。
- **Required checks**：preflight §7 acceptance（by-file）；`git status --short` 只顯示改動之 `.publish.json`；`validate:content` 0 error 保持；`check:blogger-backfill` missing -1；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；rollback plan（single-file `git restore`）on standby。

### WP-03 — Blogger backfill write 其餘篇目 rollout（逐篇 Dean-gated）

- **Goal**：於 WP-02 landed 之後，逐篇 rollout 至剩餘 6 篇 sidecar-absent + 剩餘 candidate。
- **Trigger condition**：WP-02 已 landed + Dean 提供剩餘篇目之真值 + 逐篇 approval。
- **Allowed work**：mirror WP-02；每篇獨立 approval / 獨立 phase。
- **Forbidden work**：mirror WP-02；額外禁止批量寫入（每次僅 1 篇）。
- **Required Dean approval**：每篇獨立 approval。
- **Required input data**：mirror WP-02，per 篇目。
- **Touches**：content sidecar（每篇 1 個 `.publish.json`）。
- **Risk level**：中（累積 write path 使用；仍逐篇獨立）。
- **Suggested first slice**：第 2 篇（Dean 選）；仍為 1 篇。
- **Required checks**：mirror WP-02。

### WP-04 — Admin write path activation（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`）

- **Goal**：啟用 Admin write path（目前 dormant；per `memory/project_admin_write_path_status.md`）。
- **Trigger condition**：**永 dormant**（`CLAUDE.md` §29 第一版永禁；第二版才可談）。
- **Allowed work**：無。
- **Forbidden work**：❌ 動 Admin write path；❌ 加入 `--apply` / `dryRun:false` code path；❌ 動 middleware / admin-write-cli；❌ 動 Apply 按鈕從 disabled 變 enabled。
- **Required Dean approval**：不接受（第一版永禁）；若 Dean 未來明說「進入第二版」則另議。
- **Required input data**：不接受。
- **Touches**：（禁；本 doc 不列路徑）。
- **Risk level**：極高（若啟動則破 §29 契約）。
- **Suggested first slice**：**不 slice**。
- **Required checks**：**不 apply**。

### WP-05 — Blogger preview helper B1 navigator（read-only；隔離於 build）

> **Status update（2026-07-13）**：✅ **LANDED**（2026-07-12）。B1 navigator source landed at `cc6497b`（`feat(blogger): add read-only preview navigator helper`；`src/scripts/check-blogger-preview.js` + smoke `src/scripts/check-blogger-preview-smoke.js`；registered as `check:blogger-preview` + `check:blogger-preview-smoke`；`check:blogger-preview` + smoke 49/49 PASS per landing ledger）。Operationalization landed at `cae3123`；operational rehearsal ledger `docs/20260712-blogger-preview-b1-one-post-operational-rehearsal.md`（`1ea5d58`）；live manual preview record `docs/20260712-blogger-b1-live-manual-preview-test-we-media-myself2.md`（`53cc20d`）。**B1 read-only、隔離於 build**：不動 `build:blogger` 契約 / 不改 `classify` / 不動 `dist-blogger/` / 不呼叫 Blogger API / 不進 phase1-readiness / release-readiness umbrella；未來 Route B / Route D 啟動時**不再將 WP-05 列為新的 entry candidate**。若日後 Dean 判斷需 B2 draft-aware preview build，指涉 = WP-06（仍 Dean-gated / not started）。原本欄位保留為完整 WP spec；歷史對照用。

- **Goal**：新增 `src/scripts/preview-blogger-navigator.js`（read-only；輸出 preview HTML index；不動 build 契約）+ 新增 `npm run preview:blogger`；per `docs/20260710-blogger-preview-only-script-preanalysis.md` §6 / §11。
- **Trigger condition**：Dean 明說「Blogger 手動 preview 流程繁瑣度足以支撐引入 helper；選 B1」。
- **Allowed work**：新增 script（read-only）；新增 npm script（additive-only）；動 `package.json` script 註冊；新增對應 guard / smoke 若 preanalysis §11 acceptance 要求；新增 docs 紀錄 landing acceptance。
- **Forbidden work**：❌ 改 `build:blogger` 契約（正式 `dist-blogger/` 不動）；❌ 改 `src/scripts/load-posts.js` `classify` 單一事實來源；❌ 放寬 draft 進正式 `dist-blogger/`；❌ 動 `content/**/*.md` frontmatter / `.publish.json` sidecar；❌ deploy / push gh-pages / 動 `dist/`；❌ 呼叫 Blogger API；❌ 猜任何 Blogger values；❌ 動 Blogger 後台；❌ 動 real AdSense IDs。
- **Required Dean approval**：「啟動 preview helper B1 navigator 實作 phase」。
- **Required input data**：無（不需 Dean 提供 Blogger 真值）；optional `target posts` 範圍（若無明說 default = 全體 non-draft classify.blogger）。
- **Touches**：code（新 script + `package.json` script 註冊）+ optional docs。No content / no sidecar / no deploy / no external.
- **Risk level**：低（read-only；不動 build 契約）。
- **Suggested first slice**：先新增 `src/scripts/preview-blogger-navigator.js`（read-only；輸出 preview HTML index）+ npm script 註冊 + acceptance doc；不動 build。
- **Required checks**：`git status --short` 只顯示新增 script / `package.json` script 註冊 / docs；`validate:content` 0 error 保持；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；`check:admin-markdown-export` 256/256；`check:npm-script-targets` +1（若加入新 target）；`build:blogger` byte-identical modulo `builtAt`；preanalysis §11 acceptance criteria（by-item）。

### WP-06 — Blogger preview helper B2 draft-aware preview build（隔離輸出）

- **Goal**：新增 `dist-blogger-preview/`（gitignored；PREVIEW-ONLY 標記；不動 `dist-blogger/`）+ 新 script 或極小改 `build-blogger.js` 之 preview mode；per `docs/20260710-blogger-preview-only-script-preanalysis.md` §6 / §11 之 B2。
- **Trigger condition**：Dean 明說「B1 不足以解決手動流程繁瑣度；升級到 B2」。
- **Allowed work**：先寫 minimal spec doc（不動 script）；再另開 phase 實作。
- **Forbidden work**：mirror WP-05 + 額外禁止「B2 spec 未 landed 就直接改 build:blogger」。
- **Required Dean approval**：「啟動 B2 preview build phase」+ 逐步 approval（spec → impl）。
- **Required input data**：Dean 確認 `dist-blogger-preview/` gitignored 落地無風險；optional target posts 範圍。
- **Touches**：code（build:blogger 之 preview mode）+ `.gitignore` + `package.json` + docs。No content / no sidecar / no deploy / no external.
- **Risk level**：中（動 `build:blogger` 之 preview mode；需嚴格 scope；`CLAUDE.md` §23 紅線不破）。
- **Suggested first slice**：只寫 minimal spec doc（不動 script）。
- **Required checks**：mirror WP-05 + preanalysis §11 之 B2 acceptance；`build:blogger` 正式 dist-blogger/ 不動；`check:admin-markdown-export` 256/256。

### WP-07 — GA4 P2 / P3 dimension expansion 觀察 / D4 broader

- **Goal**：於 GA4 D4 first-batch custom dimensions + raw params allowlist Route B（已 CLOSED）之上，觀察 P2 / P3 dimension 是否值得擴充。
- **Trigger condition**：Dean 於 GA4 後台觀察到 P2 / P3 dimension 缺口；且 Dean 明說啟動 docs-only 觀察 phase。
- **Allowed work**：Dean 手動於 GA4 後台觀察 + 提供 masked evidence；新增 `docs/<YYYYMMDD>-ga4-p2-p3-dimension-observation.md`（docs-only；紀錄 masked evidence + 分析 + 建議下一 slice）。
- **Forbidden work**：❌ 動 GA4 後台（Claude 不代做；per `CLAUDE.md` §3a Red lines）；❌ 動 script；❌ 動 `content/settings/ga4.config.json` 之語意；❌ 落地任何 real measurement ID / 完整 event ID。
- **Required Dean approval**：「啟動 GA4 P2 / P3 dimension observation phase（docs-only）」。
- **Required input data**：Dean 於 GA4 後台觀察之 masked evidence（screenshot / values；per `CLAUDE.md` §3a Red lines「不得在 public docs 寫出完整 measurement ID」）。
- **Touches**：docs only（無 code / content / sidecar / deploy）+ external：Dean 手動 GA4 後台觀察。
- **Risk level**：極低（docs-only；不動 script）。
- **Suggested first slice**：新增一份 observation doc；不動任何實作。
- **Required checks**：`git status --short` 只顯示新增 doc；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；docs 中 measurement ID / event ID 必為 masked。

### WP-08 — Second GitHub Pages deploy 1 篇（Dean-gated）

- **Goal**：於 first deploy 之上，deploy 1 篇 Dean-gated 篇目。
- **Trigger condition**：Dean 明列 deploy 篇目 + 明說允許 gh-pages push。
- **Allowed work**：per route selection §3 Route G：source `build:github` + copy `dist/` → deploy clone → `git commit` + `git push origin gh-pages`（Dean 明說授權）；Dean 手動 live verify；新增 landing record doc。
- **Forbidden work**：❌ 主動 deploy；❌ 動 `github-pages-blog-planning` quarantine（by design；per `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`）；❌ Deploy stale `.cache/pages`；❌ push `main` 若尚未 landing 對應 docs / config；❌ 動 Blogger / AdSense / GA4 後台；❌ 動 real AdSense IDs；❌ 動 Blogger backfill 語意。
- **Required Dean approval**：「請進入 second GitHub Pages deploy phase，篇目 = <逐篇明列>；確認 gh-pages push 明說授權」。
- **Required input data**：Dean 明列 deploy 目標篇目（file paths）+ Dean 明說允許 gh-pages push。
- **Touches**：source `build:github` + deploy clone（gh-pages）+ docs。No content / no sidecar / no external.
- **Risk level**：中-高（deploy 對 live 有直接影響；orphan / stale / canary 需事先排查）。
- **Suggested first slice**：Dean 選 1 篇；跑完 pre-deploy gates；deploy 1 篇；Dean 手動 live verify；未 verify PASS 不進 next 篇。
- **Required checks**：pre-deploy：`check:phase1-readiness` + `check:phase1-readiness-contract` + `check:github-build-cache-hygiene`（2/2）+ `check:github-pages-prepublish`（16/16）+ `check:github-pages-prepublish-smoke`（8/8）+ `validate:content`（0 error）；build：`npm run build:github`；deploy：copy dist → deploy clone → `git status` clean 或 expected diff → `git commit` → `git push origin gh-pages`（Dean 明說授權）；post-deploy：Dean 手動 live verify；landing record：新增 `docs/<YYYYMMDD>-<slug>-deploy-landing-record.md`。

### WP-09 — FB sidecar 真實寫入（`.fb.md` Apply）

- **Goal**：啟動 FB sidecar `.fb.md` Apply（目前 dormant；Apply 永久 disabled 於 Admin UI）。
- **Trigger condition**：Dean 完成 8 項 preflight 勾選 + 明說 Apply。
- **Allowed work**：per `CLAUDE.md` §3a Dormant summary + `memory/project_admin_write_path_status.md`（不細列，本 doc 不代 Dean 選 approval sequence）。
- **Forbidden work**：❌ 動 Apply 前跳過 8 項 preflight；❌ 動 Admin write path（覆蓋 §29 契約）；❌ 動 `content/**/*.fb.md` 若 preflight 尚未 landed。
- **Required Dean approval**：Dean 完成 8 項 preflight 勾選 + 明說「啟動 FB sidecar Apply phase」。
- **Required input data**：per preflight 之 8 項；本 doc 不列。
- **Touches**：Admin write path（若啟動）+ content sidecar `.fb.md`。
- **Risk level**：高（涉及 write path 首次啟用）。
- **Suggested first slice**：不 slice；本 doc 不代 Dean 走 8 項 preflight。
- **Required checks**：per 8 項 preflight（不列）。

### WP-10 — Commerce L2 / L3 / L4 新 candidates

- **Goal**：於 Commerce L1 seed 10 entries 之上，擴充 L2 / L3 / L4 新 candidates。
- **Trigger condition**：Dean 提供 YAML candidate list + explicit approval（per `memory/project_commerce_status.md`）。
- **Allowed work**：per commerce registry 契約（本 doc 不細列）。
- **Forbidden work**：❌ auto-seed；❌ 由 URL pattern 推斷 `merchantKey` / `networkKey` / `linkId`；❌ 為 fixture 修改 production `affiliate-networks.json`；❌ 動 token / credential / commission / payout / 帳號 email / 結算密碼 / 私人 Drive folder ID。
- **Required Dean approval**：Dean 提供 YAML + 明說「啟動 Commerce L2 / L3 / L4 candidate landing phase」。
- **Required input data**：Dean-provided YAML candidate list。
- **Touches**：`content/settings/commerce-links.json`（若擴充）+ docs。
- **Risk level**：中（涉及 registry 擴充）。
- **Suggested first slice**：Dean 選 1 candidate + Dean 提供完整 YAML；不代填。
- **Required checks**：`check-commerce-affiliate-resolver` PASS；`validate:content` 0 error。

### WP-11 — Blogger 實機發布頁 overflow 觀察（docs-only；純觀察）

- **Goal**：於 Blogger 實機發布頁再現水平捲軸時，紀錄 offender + scrollWidth + viewport + 跨平台是否復現 + 分類判定。
- **Trigger condition**：Dean 於實機發布頁再現水平捲軸（非 preview）+ offender 屬 `.lab-blogger-article` 內專案元素。
- **Allowed work**：per `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A + `docs/20260708-blogger-draft-preview-runbook.md` §F 走一次 debug；新增 `docs/<YYYYMMDD>-blogger-mobile-overflow-live-page-observation.md`。
- **Forbidden work**：❌ 動 CSS / build / deploy / Blogger theme；❌ 動 GitHub Pages 輸出（若日後真需 Blogger-scope hardening，屬**另一** phase；強約束：不得改變已 live-accepted 之 GitHub Pages byte-identical 輸出）；❌ 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**`；❌ 動 Blogger 後台；❌ 猜 offender / scrollWidth / viewport。
- **Required Dean approval**：「啟動 Blogger 實機 overflow 觀察 phase，附 Dean DevTools 提供之 offender / scrollWidth / viewport / 跨平台復現資料」。
- **Required input data**：Dean 於瀏覽器 DevTools 提供 offender element / selector / `scrollWidth` / viewport / 是否跨平台復現 / 分類判定。
- **Touches**：docs only + external：Dean 瀏覽器 DevTools。
- **Risk level**：極低（純觀察 + docs-only）。
- **Suggested first slice**：新增 observation doc；紀錄一次觀察；不擴大 scope。
- **Required checks**：`git status --short` 只顯示新增 doc；offender / selector / scrollWidth / viewport 均由 Dean DevTools 提供，Claude 不猜；分類判定依 runbook §F-4；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22。
- **Caveat**：**觸發條件命中時才啟動**；未觸發不執行。

### WP-12 — Download Admin picker / renderer / Forms 串接 preanalysis

- **Goal**：於 empty download registries + R-rules + R5b landed 之上，preanalysis Admin picker / renderer / Forms 串接之未來 phase 拆解。
- **Trigger condition**：Dean 明說「準備擴充 Download 系統」；或想先做 preanalysis 收攏方向。
- **Allowed work**：新增 `docs/<YYYYMMDD>-download-next-phase-preanalysis.md`（docs-only；無 script）。
- **Forbidden work**：❌ 動 Admin write path；❌ 動 `content/settings/download-*.json` 語意；❌ 落地 respondent data / token / API key / OAuth secret / 帳號 email / private permission / 私人 Drive folder ID；❌ 動 Forms API；❌ 動 Drive API（第一版永禁）。
- **Required Dean approval**：「啟動 Download next-phase preanalysis（docs-only）」。
- **Required input data**：Dean 想討論之 Download 面向（例：Admin picker UX / 免登入下載體驗 / Forms 收集 vs 私人 Drive folder）。
- **Touches**：docs only。
- **Risk level**：極低（docs-only）。
- **Suggested first slice**：新增 preanalysis doc。
- **Required checks**：`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22。

### WP-13 — `github-pages-blog-planning` quarantine 解除

- **Goal**：解除 `content/github/posts/20260504-github-pages-blog-planning.md` 之 quarantine（目前 hold by design；per `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`）。
- **Trigger condition**：Dean 明說解除 + 明說預期 online 之目標行為。
- **Allowed work**：per quarantine doc 明列之解除流程（本 doc 不代 Dean 選）。
- **Forbidden work**：❌ 主動解除；❌ 動 quarantine doc 之判定；❌ 動 orphan / stale / canary 之偵測邏輯。
- **Required Dean approval**：Dean 明說「啟動 quarantine 解除 phase；預期 online 目標 = <明列>」。
- **Required input data**：Dean 明說預期 online 之目標行為。
- **Touches**：content frontmatter（若 flip draft）+ deploy（若 deploy）+ docs。
- **Risk level**：中（涉及 live 觀察）。
- **Suggested first slice**：per quarantine doc（本 doc 不代 Dean 選）。
- **Required checks**：per quarantine doc + WP-08 之 checks。

### WP-14 — Custom domain Gate D prep-1（docs-only prep phase）

- **Goal**：per `docs/20260710-custom-domain-adsense-trigger-checklist.md` §6 之 `custom-domain-prep-1`：新增 `docs/<YYYYMMDD>-custom-domain-prep-1-<slug>.md`（docs-only preflight；不動 DNS）。
- **Trigger condition**：Dean 明說「啟動 Gate D，`<domain>`（例如 `babel-lab.tw`），已註冊 + 可管 DNS」。
- **Allowed work**：新增 prep-1 doc（docs-only）；至多跑 `check:phase1-readiness` / `-contract`。
- **Forbidden work**：❌ 買 domain / 設 DNS / 建 `CNAME` / 建 `ads.txt`（含 placeholder / fake）；❌ 動 GitHub Pages custom domain 設定；❌ 動 real IDs；❌ 動 Phase 1 RC baseline。
- **Required Dean approval**：Dean 明說 domain 字串 + 註冊商 + DNS 管理權限。
- **Required input data**：domain 字串 / 註冊商 / DNS 管理權限確認。
- **Touches**：docs only。
- **Risk level**：極低（docs-only prep）。
- **Suggested first slice**：新增 prep-1 doc。
- **Required checks**：`git status --short` 只顯示新增 doc；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；checklist §6 acceptance（by-phase）。

### WP-15 — Custom domain Gate D DNS / CNAME landing（實 DNS 落地）

- **Goal**：於 prep-1..7 全 landed 之後，Dean 手動於 registrar 設 DNS + Claude 於 repo 落地 `CNAME`（domain 字串）；per checklist §6。
- **Trigger condition**：prep-1..7 全 landed + Dean 明說 DNS 落地。
- **Allowed work**：新增 `CNAME`（含真實 domain 字串；Dean 提供）；動 GitHub Pages custom domain 設定（Dean 手動於 GitHub UI）；新增 landing record doc。
- **Forbidden work**：❌ 猜 domain / DNS 設定；❌ 落地 placeholder / fake `CNAME`；❌ 動 real AdSense IDs；❌ 動 Blogger 後台；❌ 動 Phase 1 RC baseline。
- **Required Dean approval**：Dean 明說「啟動 Gate D DNS 落地 phase」+ 提供 real domain 字串 + 完成 DNS 設定。
- **Required input data**：real domain 字串（Dean 提供）+ Dean 手動於 registrar 設 DNS + Dean 手動於 GitHub Pages settings 設 custom domain。
- **Touches**：deploy（gh-pages branch `CNAME`）+ external（DNS + GitHub Pages settings）+ docs。
- **Risk level**：高（外部 DNS 影響 live SEO；一次性 SEO 折損 windows）。
- **Suggested first slice**：Dean 手動於 registrar 設 DNS + Claude 於 deploy clone 落地 `CNAME`（Dean 明說授權）+ Dean 手動於 GitHub Pages settings 設 custom domain + Dean 手動 live verify。
- **Required checks**：pre-landing：所有 prep-1..7 已 landed；landing 後 Dean 手動 live verify（HTTPS 生效 / 舊 URL 301 redirect / SEO 觀察）；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22。

### WP-16 — AdSense Gate A prep-1（docs-only prep phase）

- **Goal**：per checklist §6 之 `adsense-1`：新增 `docs/<YYYYMMDD>-adsense-prep-1-<slug>.md`（docs-only preflight；不落地 pub id）。
- **Trigger condition**：Dean 明說「啟動 Gate A，附 Dean 手動取得之 pub id」。
- **Allowed work**：新增 prep-1 doc（docs-only）；至多跑 `check:phase1-readiness` / `-contract`。
- **Forbidden work**：❌ 落地 real pub id（除於 `content/settings/ads.config.json`；per `CLAUDE.md` §3a Red lines）；❌ 落地 placeholder / fake pub id；❌ 建 `ads.txt`；❌ 動 AdSense 後台；❌ 動 production ad script。
- **Required Dean approval**：Dean 明說 pub id 已取得。
- **Required input data**：Dean 手動取得之 real pub id（僅於後續 landing phase 落地）。
- **Touches**：docs only。
- **Risk level**：極低（docs-only prep）。
- **Suggested first slice**：新增 prep-1 doc。
- **Required checks**：`git status --short` 只顯示新增 doc；docs 中 pub id 必為 masked / placeholder；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；checklist §6 acceptance（by-phase）。

### WP-17 — AdSense Gate A pub id landing / `ads.txt`

- **Goal**：於 prep-1..5 全 landed 之後，Dean 於 AdSense 後台完成申請 + Claude 於 `content/settings/ads.config.json` 落地 real pub id + 於 root 落地 `ads.txt`。
- **Trigger condition**：prep-1..5 全 landed + Dean 完成 AdSense 後台申請 + 明說啟動 landing。
- **Allowed work**：動 `content/settings/ads.config.json`（落地 real pub id；per red lines「real IDs 只存於該檔」）；新增 `ads.txt`（於 deploy clone root）；新增 landing record doc。
- **Forbidden work**：❌ 落地 real IDs 於非 `content/settings/ads.config.json`；❌ 落地 real IDs 於 docs / `CLAUDE.md` / src / views / tests / frontmatter；❌ 動 GA4 dashboard；❌ 猜任何 pub id。
- **Required Dean approval**：Dean 明說「啟動 Gate A landing phase」+ 提供 real pub id + 完成 AdSense 後台申請。
- **Required input data**：real pub id（Dean 手動取得）+ AdSense 後台 approved 狀態確認。
- **Touches**：`content/settings/ads.config.json` + deploy `ads.txt` + external（AdSense 後台）+ docs。
- **Risk level**：中（改 production ad script；影響 live）。
- **Suggested first slice**：per checklist 之 landing sequence；Dean 明說每一步。
- **Required checks**：`check:adsense-resolver` PASS；`check:adsense-article-block` PASS；`check:adsense-anchor-wiring` PASS；`check:blogger-adsense-output` PASS；`validate:content` 0 error；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；docs 中 pub id 必為 masked。

### WP-18 — Blogger AdSense Batch 2 P2 live repost（`ai-tools-simplify-daily-workflow`）

- **Goal**：於 P2 content landed 之上，執行 Batch 2 P2 之 live repost（目前 BLOCKED；per `CLAUDE.md` §3a Dormant summary）。
- **Trigger condition**：Dean 明說「啟動 P2 live repost phase」。
- **Allowed work**：per Batch 2 preflight（本 doc 不代 Dean 選）；Dean 手動於 Blogger 後台 repost；Claude 於 dist-blogger/ 產出 HTML；不代發布。
- **Forbidden work**：❌ 動 Blogger 後台（Claude 不代做）；❌ 猜 Blogger values；❌ 動 real AdSense IDs（除 §17 landed）；❌ 動 Phase 1 RC baseline。
- **Required Dean approval**：Dean 明說「啟動 Batch 2 P2 live repost」。
- **Required input data**：Dean 手動於 Blogger 後台 repost 之結果 + Dean 提供之 masked evidence（screenshot）。
- **Touches**：dist-blogger（rebuild）+ external（Blogger 後台）+ docs。
- **Risk level**：中（涉及 live Blogger repost；由 Dean 手動執行）。
- **Suggested first slice**：per Batch 2 preflight。
- **Required checks**：`check:blogger-adsense-output` PASS；`validate:content` 0 error；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22；Dean 手動 live verify + 提供 masked evidence。

### WP-19 — Reverse UTM pm-26 deploy（Blogger → GitHub source landed；live but dormant）

- **Goal**：於 pm-24a / pm-24b / pm-24c source landed（`7e1d356` / `e2309e9` / `7c769fe`，2026-05-23）之上，啟動 pm-26 deploy + Dean 手動重貼 Blogger + GA4 Realtime 驗收。
- **Trigger condition**：Dean 明說「啟動 pm-26 deploy」；per `docs/reverse-utm-fixture-plan.md` §6。
- **Allowed work**：per fixture plan §6（本 doc 不代 Dean 選 sequence）。
- **Forbidden work**：❌ 主動 deploy；❌ 動 GA4 後台（Claude 不代做）；❌ Dean 手動重貼 Blogger 之外的自動 repost；❌ 動 Phase 1 RC baseline。
- **Required Dean approval**：Dean 明說「啟動 pm-26 deploy phase」+ 完成 gh-pages push 授權 + 完成 Dean 手動 Blogger 重貼 + GA4 Realtime 驗收。
- **Required input data**：Dean 手動 Blogger 重貼結果 + Dean 提供 GA4 Realtime masked evidence。
- **Touches**：deploy（gh-pages push）+ external（Blogger 後台 / GA4 Realtime）+ docs。
- **Risk level**：中-高（涉及 live SEO / GA4）。
- **Suggested first slice**：per fixture plan §6。
- **Required checks**：pre-deploy：mirror WP-08；post-deploy：Dean 手動 GA4 Realtime 驗收；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22。

### WP-20 — Admin richer fields / ready option / R2+ / loader migration

- **Goal**：於 Admin idle freeze 之上，擴充 Admin 之 richer fields / ready option / R2+ readability / loader migration；per `CLAUDE.md` §3a ADMIN idle freeze。
- **Trigger condition**：Dean 明說「啟動 Admin richer fields phase」+ 明說擴充範圍。
- **Allowed work**：per Admin phase discipline（本 doc 不代 Dean 選）；仍 dev-only / no prod build / no deploy / noindex。
- **Forbidden work**：❌ 動 Admin write path；❌ 動 export contract（維持 `status:"draft"` + `draft:true`）；❌ 動 free-text category（`<select id="npd-category">` registry-bound；per `CLAUDE.md` §3a）；❌ 動 `check:admin-markdown-export` 語意；❌ browser-run smoke 引入 Playwright / devDep；❌ 動 write path。
- **Required Dean approval**：Dean 明說「啟動 Admin richer fields phase；範圍 = <明列>」。
- **Required input data**：Dean 想擴充之欄位範圍。
- **Touches**：`src/views/admin/**` + `src/scripts/**` + `content/templates/**`（若動 template）+ docs。
- **Risk level**：低（dev-only；不進 prod build；不 deploy）。
- **Suggested first slice**：Dean 選 1 欄位 / 1 R-series；本 doc 不代 Dean 選。
- **Required checks**：`check:admin-markdown-export` 256/256（或更多）；`validate:content` 0 error；`check:phase1-readiness` exit 0；`check:phase1-readiness-contract` 22/22。

---

## 5. Recommended Phase 2 entry candidates

依 Dean 目標分岔（本 doc **不排** entry candidates 之間 preferred order；也**不代** Dean 選）。**2026-07-13 reconciliation**：WP-01 rehearsal template + WP-05 B1 navigator 均已 landed（見 §0.5），已從下表**移除**；WP-02 準備工作 landed、實寫入仍 Dean-gated（見 §0.5）。

| Dean 目標 | 推薦 entry WP | 為什麼 |
| --- | --- | --- |
| 「已取得 Blogger 後台真值 + 想寫 1 篇 sidecar」 | **WP-02**（實寫入；準備工作已 landed，見 §0.5） | 1 篇 sidecar write；write path 首觸；per preflight §7 acceptance；Dean 提供 real `publishedUrl` / `publishedAt` 為 hard gate |
| 「Blogger 實機發布頁再現水平捲軸」 | **WP-11** | docs-only 觀察；觸發條件命中才啟動 |
| 「累積內容 / 觀察 SEO 到啟動 custom domain（Gate D）」 | **WP-14** | docs-only prep-1；不動 DNS / CNAME |
| 「AdSense 資產先鋪（Gate A）」 | **WP-16** | docs-only prep-1；不落地 pub id |
| 「Download 系統擴充方向 preanalysis」 | **WP-12** | docs-only preanalysis |
| 「GA4 dimension 觀察」 | **WP-07** | docs-only 觀察；Dean 手動 GA4 後台 + masked evidence |
| 「Blogger 手動 preview 流程繁瑣度需再進一步 helper 支援」 | **WP-06**（B2 draft-aware preview build） | B1 read-only helper 已 landed（見 §0.5）；若 B1 仍不足才討論 B2；B2 尚未實作 / Dean-gated |
| 「先 rehearsal Blogger backfill write flow」 | ✅ 已 landed（WP-01；見 §0.5），**不再是新 entry** | — |
| 「引入 Blogger preview navigator helper（read-only）」 | ✅ 已 landed（WP-05 B1；見 §0.5），**不再是新 entry** | — |

**caveat**：本 §5 為 recommendation，**非**強制流程；Dean 可依當下判斷選擇 WP，Claude 於下一 session 明確 approval 時執行。**已 landed 之 WP-01 / WP-05 不得再被列為新 entry candidate**；若要新增 rehearsal / refresh / re-run，須 explicit approval + 另開 phase。

---

## 6. Candidates that should remain blocked

以下 WP 於本 doc 明確 **blocked / dormant / red-line**；本 doc 不放路徑、不啟動、不代 Dean 選；若 Dean 未來明說推進，仍須另開獨立 phase + 額外 approval：

| WP | 為何 blocked / dormant | 主要 pointer |
| --- | --- | --- |
| WP-04 Admin write path activation | 第一版永禁；`CLAUDE.md` §29 | `memory/project_admin_write_path_status.md` |
| WP-09 FB sidecar 真實寫入 | dormant；待 Dean 8 項 preflight | `CLAUDE.md` §3a Dormant summary |
| WP-10 Commerce L2 / L3 / L4 新 candidates | BLOCKED；user-provided YAML + explicit approval | `memory/project_commerce_status.md` |
| WP-13 `github-pages-blog-planning` quarantine 解除 | hold by design | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| WP-15 Gate D DNS / CNAME landing | Phase 1 RC 階段 blocked；Prep-1..7 未 landed | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §9 |
| WP-17 Gate A pub id landing | Phase 1 RC 階段 blocked；Prep-1..5 未 landed | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §9 |
| WP-18 Blogger AdSense Batch 2 P2 live repost | BLOCKED；至 explicit approval | `docs/20260612-blogger-adsense-batch-*` |
| WP-19 Reverse UTM pm-26 deploy | BLOCKED；source landed / live dormant | `memory/project_reverse_utm_status.md`；`docs/reverse-utm-fixture-plan.md` §6 |
| Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB）| 第一版永禁 | `CLAUDE.md` §29 |
| Phase 1 final 之降級 / 重新封存 | 永禁 | `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 永禁 | `CLAUDE.md` §3a Historical ledger replacement rule |

---

## 7. What Claude must not start autonomously

以下項目 Claude 於任何 session（含未來 session cold-start）**皆不主動啟動**、**皆不代 Dean 決策**；均須 Dean explicit approval + 對應 phase 才可執行：

| 項目 | 對應 WP | 主要 pointer |
| --- | --- | --- |
| Blogger backfill write phase 啟動 + 補真值 | WP-02 / WP-03 | `docs/20260710-blogger-backfill-write-phase-preflight.md` |
| 動 `.publish.json` sidecar 之任何欄位 | WP-02 / WP-03 | 同上 |
| 建立 6 篇 sidecar-absent 之新 sidecar | WP-02 / WP-03 §5 / §8 | 同上 |
| Blogger preview helper B1 navigator 實作 | WP-05 | ✅ landed 2026-07-12（`cc6497b`；`docs/20260712-preview-only-helper-implementation.md`）；此列僅為歷史對照 |
| Blogger preview helper B2 draft-aware preview build 實作 | WP-06 | `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2 / §11；B2 仍未實作 / Dean-gated |
| 動 `build:blogger` / `classify` / `dist-blogger/` 契約 | WP-06 gate | 同上（B2 gate；B1 未動這三者） |
| Custom domain Gate D 啟動 + 買 domain / 設 DNS / 建 `CNAME` | WP-14 / WP-15 | `docs/20260710-custom-domain-adsense-trigger-checklist.md` §5 / §6 |
| AdSense Gate A 啟動 + 落地 real pub id / `ads.txt` | WP-16 / WP-17 | 同上 §8 / §10 / §11 |
| Blogger 實機 overflow 觀察啟動 | WP-11 | `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md` §7 Option A |
| Second GitHub Pages deploy | WP-08 | `docs/20260703-post-c1-next-deploy-candidates.md` |
| Blogger AdSense Batch 2 P2 live repost | WP-18 | `docs/20260612-blogger-adsense-batch-*` |
| Reverse UTM pm-26 deploy | WP-19 | `docs/reverse-utm-fixture-plan.md` §6；`memory/project_reverse_utm_status.md` |
| `github-pages-blog-planning` 解除 quarantine | WP-13 | `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` |
| Admin write path 啟動（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | WP-04 | `memory/project_admin_write_path_status.md` |
| FB sidecar 真實寫入 | WP-09 | 待 Dean 勾選 8 項 preflight |
| Commerce L2 / L3 / L4 新 candidates | WP-10 | `memory/project_commerce_status.md` |
| GA4 P2 / P3 dimension expansion 觀察 | WP-07 | `CLAUDE.md` §3a Red lines（Claude 不動 GA4 後台） |
| Download Admin picker / renderer / Forms 串接 | WP-12 | `memory/project_download_status.md` |
| Admin richer fields / ready option / R2+ / loader migration | WP-20 | `CLAUDE.md` §3a ADMIN idle freeze |
| Phase 2 功能（後台登入 / 視覺編輯器 / Blogger API / Drive API / View 數 / 讚 / 留言 / 全文搜尋 / DB）| （不列 WP；永禁）| `CLAUDE.md` §29 |
| Phase 1 final 之降級 / 重新封存 | （不列 WP；永禁）| `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | （不列 WP；永禁）| `CLAUDE.md` §3a Historical ledger replacement rule |
| Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台任何動作 | 各 WP 均 forbidden | `CLAUDE.md` §3a Red lines |
| 猜任何 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | 各 WP 均 forbidden | `docs/20260706-blogger-identity-and-backfill-strategy.md` |
| 升 report-only guard 為 fail-fast | 各 WP 均 forbidden | `memory/project_report_only_metadata_guards.md` §6 |

---

## 8. Non-goals for this session

本 session 明確不做（cumulative；違反即 abort）：

| 項目 | 狀態 |
| --- | --- |
| 動 `src/**` / `views/**` / `styles/**` / `js/**` / `scripts/**` / EJS / SCSS / JS | ❌ 未動 |
| 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 未動 |
| 動 `content/settings/*.json` | ❌ 未動 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 動 `package.json` / `package-lock.json` | ❌ 未動 |
| 新增 npm script / guard / preview-only script | ❌ 未做 |
| 跑 `npm run build:*` / `preview` / `dev` | ❌ 未跑 |
| 跑其他 `check:*` guard（除 §0 兩支 phase1-readiness）| ❌ 未跑 |
| deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 未動 |
| Blogger 後台 / repost / draft flip / URL 設定 / 標籤設定 / 圖片上傳 | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| Blogger backfill write phase / 建立任何新 sidecar / 動既有 sidecar | ❌ 未動 |
| Blogger AdSense Batch 2 P2 live repost | ❌ 未動 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| 買 custom domain / 設 DNS / 建 `CNAME` / 建 `ads.txt`（含 placeholder / fake）| ❌ 未做 |
| AdSense formal application / 動 production ad script | ❌ 未做 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 未做 |
| 新增規則 / 新增契約 / 改流程 | ❌ 未做（本 doc 純 planning preanalysis） |
| 代 Dean 決策 / 啟動 WP-01 … WP-20 任一 | ❌ 未做 |
| 排 §5 entry candidates 之間 preferred order | ❌ 未做（本 doc §5 僅列判斷面向、不代 Dean 選）|
| 開始 Phase 2 implementation | ❌ 未做 |

---

## 9. Idle-freeze recommendation

**Recommendation = remain docs-only unless Dean explicitly chooses one Phase 2 WP**（沿用 `CLAUDE.md` §3a Recommended next paths；handoff readout §8；next-readiness §8；docs-index §11；route selection §8）。理由：

1. Phase 1 RC baseline 於本 session 已再驗、未 drift；readiness 兩支 guard 皆 exit 0；deploy clone 未動。
2. Route selection doc（`ca9e94f`）已 landed；A–G routes 已明列；本 doc 進一步把 Route B 之落地為 WP-01 … WP-20，補齊細顆粒 lookup。
3. 目前**無** blocking issues（P0 = none；P1-1 resolved / P1-2 documented accepted / P1-3 downgraded to P2 external artifact）。
4. WP-01 … WP-20 皆屬 RC 邊界外之候選；啟動任一均須 Dean explicit approval + 對應 phase；本 doc 不代 Dean 選。
5. 本 doc 之角色 = 未來 session 之單頁 WP lookup；今日不做任何啟動決策；今日不排 entry candidates 之間 preferred order。

**若 Dean 於未來 session 明確判斷需推進**：依 §5 之 Dean 目標分岔選 WP；每個 WP 皆須另開獨立 phase + explicit approval + 對照 handoff readout §5.3 Session rules gate。

---

## 10. Next suggested small slice（本 doc 之下一 slice；仍需 Dean approval）

本 doc landing 後，下一 slice 之候選（Claude **不代** Dean 選、**不主動啟動**；此段僅為候選列表）：

- **候選 A**：docs-only refinement — 若 Dean 想再拆某個 WP 為更細之 sub-slices（例：WP-01 rehearsal doc 之 template 落地 / WP-05 B1 navigator 之 minimal spec doc 落地）→ 屬本 Route B 之後續深化。
- **候選 B**：若 Dean 目標明確指向某 WP → 啟動該 WP 之 first slice（例：WP-01 rehearsal doc / WP-14 domain prep-1 doc / WP-16 AdSense prep-1 doc / WP-11 overflow observation doc）。
- **候選 C**：若 Dean 決定「Phase 2 尚未進入」→ remain idle freeze；本 doc 為未來 session 之 lookup 入口。

**Claude 不主動選任一候選；不啟動任一 WP；不代 Dean 決策**。若 Dean 未於未來 session 明說推進，維持 idle freeze。

---

## 11. 變更安全性（docs-only）

**2026-07-13 reconciliation slice**（同性質 docs-only additive update；唯一 mutation = 本檔之 §0.5 新增 + §1.B 分類補「Completed since original doc」+ WP-01 / WP-02 / WP-05 段落各加 Status update 註記 + §5 entry candidates 表移除已 landed 者 + §7 must-not-start 表對 B1 / B2 拆分）：**未**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`；**未**新增契約 / 規則 / red-line；**未**移除任何既有 red-line；**未**宣告新 PASS；**未**代 Dean 決策；**未**啟動任一 WP；**未**動任何 sidecar / frontmatter；**未**猜任何 Blogger 值。原本 2026-07-10 landing 之欄位皆保留為完整 WP spec、僅在 WP-01 / WP-02 / WP-05 上加註 Status update 註記；歷史對照仍可讀。

原本 2026-07-10 landing 之 §11 敘述保留於下（僅適用於原本 landing 時之狀態；不 override 本 §11 開頭之 reconciliation 補述）：

本檔為 docs-only 新增，唯一 mutation = 本檔（+ 對應 commit + push origin/main）。**不含**任何程式 / frontmatter / settings / sidecar / build / deploy / dev-server 變更；未新增 guard / npm script / preview-only script / helper script；未改 `.gitignore`；未改 CSS；未改 `CLAUDE.md` / `MEMORY.md` / `memory/`；未觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未從任何 metadata 推導 Blogger internal ID；未新增測試文章 / artifact；未建 `CNAME` / `ads.txt`（含 placeholder / fake）；未動 `content/settings/ads.config.json`；未升級任何 report-only guard 為 fail-fast。§0 boot baseline 為本 session read-only 驗證；§1 結論為對既有 result / RC docs 之盤點結論，未代替 Dean 宣告新 PASS；§2 Phase 1 RC 關係為既有 family 之外圍延伸描述，未 downgrade Phase 1 RC；§3 source docs 為本 session read-only 讀取盤點；§4 WP-01 … WP-20 為對既有 preflight / preanalysis docs 之細顆粒拆分整理，未新增契約；§5 recommended entry candidates 為建議、非強制流程；§6 blocked 列沿用 `CLAUDE.md` §3a Dormant summary + `memory/project_*_status.md` + 各 preflight docs；§7 Claude must not start autonomously 沿用 `CLAUDE.md` §3a Red lines + route selection §6；§8 non-goals 沿用 route selection §7 + `CLAUDE.md` §3a Red lines；§9 idle-freeze recommendation 沿用 `CLAUDE.md` §3a Recommended next paths；§10 next slice 為候選列表、非決策。

---

## See also

- `docs/20260710-phase1-rc-next-phase-route-selection.md`（Route selection preanalysis；本 doc 為 §3 Route B 之落地）
- `docs/20260710-phase1-rc-docs-index.md`（2026-07-10 家族 8 份 docs 之單頁 lookup index；本 doc §5 / §6 之上位）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff / operating readout；本 doc §2 / §7 引用）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料來源 audit + 4 步 workflow；WP-05 / WP-06 上位）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview 40 項 sanity checklist）
- `docs/20260710-phase1-rc-next-readiness-analysis.md`（RC readiness re-verify + 三份 workflow docs 影響面 audit）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（WP-01 / WP-02 / WP-03 上位；本 doc §4 引用 §2 / §4 / §5 / §7 / §8 / §9 / §10）
- `docs/20260710-blogger-backfill-write-rehearsal-template.md`（WP-01 rehearsal template；`f1aec08`；2026-07-13 §0.5 reconciliation 引用）
- `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md`（WP-01 one-post worksheet；`5c92d15`；2026-07-13 §0.5 reconciliation 引用）
- `docs/20260710-blogger-backfill-wp02-intake-template.md`（WP-02 intake template；`631ba5c`；2026-07-13 §0.5 reconciliation 引用）
- `docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md`（WP-02 seven-candidate dry-run 報告；`79dec13`；2026-07-13 §0.5 reconciliation 引用）
- `docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md`（WP-02 true-value intake packet；`e61730e`；2026-07-13 §0.5 reconciliation 引用）
- `docs/20260712-preview-only-helper-implementation.md`（WP-05 B1 navigator implementation ledger；`cc6497b`；`check:blogger-preview` + `check:blogger-preview-smoke` 49/49；2026-07-13 §0.5 reconciliation 引用）
- `docs/20260712-blogger-preview-b1-one-post-operational-rehearsal.md`（WP-05 B1 operational rehearsal；`1ea5d58`）
- `docs/20260712-blogger-b1-live-manual-preview-test-we-media-myself2.md`（WP-05 B1 live manual preview test；`53cc20d`）
- `docs/20260710-custom-domain-adsense-trigger-checklist.md`（WP-14 / WP-15 / WP-16 / WP-17 上位；本 doc §4 引用 §5 / §6 / §8 / §10 / §11）
- `docs/20260710-blogger-preview-only-script-preanalysis.md`（WP-05 / WP-06 上位；本 doc §4 引用 §6 / §11）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet；本 doc 為其 §C 候選 2 之更深一層落地）
- `docs/20260708-phase1-stability-closeout-rc-note.md`（Phase 1 stability closeout RC note；本 doc §1 引用 §F）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；P1/P2 follow-up 分級來源）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型人工 smoke；P1-1 verified resolved）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（Admin `#blogger-export` 5 顆 Copy 按鈕 fix landing record；commit `38a4e98`）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；含 §F overflow debug；WP-11 §F-4 分類判定規則來源）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（build eligibility 盤點 + Option A/B/C；WP-06 sourced from §7 Option B）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（WP-11 §7 Option A 上位）
- `docs/20260708-domain-github-pages-adsense-decision.md`（domain / AdSense 決策盤點；WP-14–WP-17 上位）
- `docs/20260708-adsense-source-evidence-audit.md`（AdSense 官方來源稽核；WP-16 / WP-17 上位）
- `docs/custom-domain-root-files-strategy.md`（custom domain 遷移機制；WP-14 / WP-15 上位）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；WP-02 / WP-03 之「不猜 ID」上位）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill sidecar canonical location；WP-02 / WP-03 sidecar 路徑上位）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline）
- `docs/20260706-blogger-backfill-value-intake-template.md`（backfill 真值收集模板；WP-02 引用）
- `docs/20260707-release-readiness-docs-index.md`（release-readiness 家族之單點索引；本 doc §1.B validation baseline 之 carry-forward 上位）
- `docs/20260707-release-readiness-runbook.md` / `docs/20260707-release-readiness-clean-baseline-verification.md` / `docs/20260707-release-readiness-contract-baseline-verification.md` / `docs/20260707-metadata-all-prepublish-integration-audit.md`（release-readiness 家族）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path PASS）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（GitHub Pages publish path readiness + prepublish checklist；`check:phase1-readiness` 之 required doc）
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`（session start dual-repo baseline snapshot；`check:phase1-readiness` 之 required doc）
- `docs/20260703-post-c1-next-deploy-candidates.md`（WP-08 candidate roster 上位）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（WP-13 quarantine hold 依據）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（唯一 production expected warning 之依據）
- `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md`（Phase 1 functional final 2026-05-18 宣告）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（收尾路線圖 A/B/C/D/E 各線）
- `docs/reverse-utm-fixture-plan.md`（Reverse UTM fixture plan；WP-19 §6 上位）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths；本 doc 之上位）
- `CLAUDE.md` §5（分階段）、§7（Blogger 發布 checklist）、§14 / §15（tags / categories registry）、§16.4（cross-link UTM）、§17（文章頁基本版型）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§24（Blogger 發布 URL 回填）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella；本 doc §7 之 upgrade-forbidden 上位）
- `memory/project_admin_write_path_status.md`（Admin write path dormant；WP-04 上位）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED；WP-19 上位）
- `memory/project_commerce_status.md`（Commerce L1 seed / L2+ blocked / C7 deferred；WP-10 上位）
- `memory/project_download_status.md`（empty registries；R-rules + R5b landed；production migration blocked；WP-12 上位）
- `memory/project_phase1_rc_2026_07_10_family.md`（2026-07-10 docs family 上位；本 doc §2 之 memory upstream）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊；本 doc §8 之 discipline 上位）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple）

---

（本文件結束 / end of document）
