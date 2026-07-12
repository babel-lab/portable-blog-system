# Preview-only helper B1 implementation（source slice）

- 建立日期：2026-07-12（Asia/Taipei）
- 類型：source slice **實作 landing note**（唯一 source mutation = 新增 2 支 `src/scripts/*.js`
  + `package.json` scripts 註冊 2 條；docs 新增本檔。**未**動 content / frontmatter /
  `.publish.json` sidecar / settings / views / styles / js / templates / EJS / SCSS / `dist-blogger/` /
  `dist/` / deploy clone / gh-pages / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 目的：把 `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.1（Variant B1 navigator）
  之 Recommendation 由 preanalysis 落地為可實際使用之 read-only helper，同時附一支契約 smoke
  將 no-write / determinism / static-forbidden-imports 三項不變式靜態化。
- 觸發：Dean explicit approval（2026-07-12 session briefing：「依據 repo 內既有的 preview-only helper
  preanalysis、route-selection 與 Phase 2 scope 文件，實作一個真正可使用、但完全沒有寫入副作用
  的 preview-only helper。」對應 `docs/20260710-phase1-rc-next-phase-route-selection.md` §3 Route D
  之 B1）。

---

## 0. Boot baseline

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `88190cd` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | — | 本 slice **未讀 / 未寫** | — | — | — |

Source HEAD full hash = `88190cd0372621de671a40a6cf4926bf706b8da3`；subject
`test(publish): add download page temp-build smoke`。

本 slice 起始 baseline 之 readiness snapshot（本 slice 之前已 landed；未動）：

- `validate:content`：0 error / 135 warning / 107 post
- `check:npm-script-targets`：57/57 → **本 slice 升為 59/59**（新增 2 支 script × 1 target 各）
- `check:phase1-readiness`：exit 0
- `check:phase1-readiness-contract`：23/23 PASS
- `check:release-readiness`：exit 0
- `check:release-readiness-contract`：14/14 PASS
- `check:blogger-backfill`：scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（report-only；本 slice 未動語意）

Deploy clone 本 slice 未讀、未寫、未觸碰；deploy HEAD `1170e7e` carry-forward 於 baseline
memory / prior docs，非本 slice 之責任範圍。

---

## 1. 選定 route + 對應文件

依 briefing 之三份 preanalysis 文件對照：

| 文件 | §引用 | 對本 slice 之影響 |
| --- | --- | --- |
| `docs/20260710-blogger-preview-only-script-preanalysis.md` | §6.1（B1 navigator） / §7 allowed / §8 forbidden / §9 gates / §10 naming / §11.1 acceptance | 主 spec；本 slice = §6.1 之落地實作、§10 之推薦命名（`check:blogger-preview`）、§11.1 之 acceptance by-item |
| `docs/20260710-phase1-rc-next-phase-route-selection.md` | §3 Route D | 選定 Route D 之 B1；未跨 Route C / E / F / G |
| `docs/20260709-blog-phase2-next-work-packet.md` | §C 候選 5 | 對應「Blogger preview-only script Option B preanalysis」之後續實作 slice |
| `docs/20260708-blogger-draft-preview-runbook.md` | §D 6 步 workflow | Helper 之 advice 指向本 doc §D-4 / §D-7 |
| `docs/20260710-blogger-preview-sanity-analysis.md` | §5 40 項 sanity | Helper 之 pointers 提及作為後續 sanity 步驟 |
| `docs/20260710-blogger-admin-export-workflow-alignment.md` | §2 資料源 audit | Helper 沿用 Admin `#blogger-export` 相同資料來源（source-driven, 不讀 dist 判定 candidate） |

**選定 variant = B1 navigator（read-only）**。理由：
1. Preanalysis §13 recommendation 為 idle freeze；但 Dean explicit approval 於本 session 明確要求
   實作一支「真正可使用、完全沒有寫入副作用」之 preview-only helper，唯一對應 = B1（B2 = draft-aware
   preview build，涉及新 `dist-blogger-preview/` + `.gitignore` 對齊 + PREVIEW-ONLY 標記，非本 slice 授權）。
2. B1 收益明確（「一步列出 dist-blogger/posts/<slug>/ 4 檔存在性」vs Dean 目前跨 Admin + file
   explorer 兩步）；風險零（不建立新 dist 目錄、不動 `build:blogger` 契約、不改 `classify`）。
3. 選 `check:*` 命名前綴（preanalysis §10 建議）：與 `check:blogger-backfill` 讀 sidecar / 產
   report 的 read-only 語意一致；且避免與 Vite `preview` 命名混淆。

---

## 2. Helper contract

```
input:            CLI args:
                    (none)                     → list mode
                    --slug <slug>              → focus mode
                    --json                     → machine-readable JSON to stdout
                    --slug <slug> --json       → combined
                    --dry-run                  → no-op (accepted for CLI shape parity)
                    --help / -h                → usage help
lookup:           - content/blogger/posts/**/*.md
                  - content/github/posts/**/*.md（filter publishTargets.blogger.enabled === true）
                  - excludes *.fb.md
                  （不透過 loadBloggerPosts，因需保留 filtered-out 資訊給 diagnostic；
                    但過濾規則等價於 load-posts.js 的 classify：draft !== true 且
                    status ∈ {ready, published}）
normalization:    - resolveBloggerMode()：full / summary / redirect-card；預設 full
                  - classifyDraft()：與 load-posts.js 同義
renderer:         - console text + JSON snapshot（read-only）
                  - 4 output files 逐檔 fs.stat：post.html / copy-helper.txt / publish-checklist.txt / meta.json
                  - dist-blogger/posts/<slug>/ 缺 → advice 指向 `npm run build:blogger`
output:           - stdout：human-readable listing / focus report
                  - stdout（--json）：JSON snapshot
                  - stderr：--dry-run no-op note only
cleanup:          - N/A：navigator 不建立 temp 檔、不寫任何檔
error behavior:   - unknown slug → exit 0 + warning advice
                  - candidate is filtered (draft) → exit 0 + advice 指向 runbook §D-4
                  - frontmatter parse error → exit 0 + advice attach 錯誤訊息
                  - script crash / IO error → exit 1
```

---

## 3. No-write boundary

| 項目 | 狀態 |
| --- | --- |
| content/**/*.md unchanged | ✅（fingerprint before/after equal；smoke case #34） |
| **/*.publish.json unchanged | ✅（同上） |
| content/settings/** unchanged | ✅（helper 未 import；smoke source pattern check） |
| dist-blogger/** unchanged | ✅（helper 只 fs.stat；未 writeFile / mkdir / rm / unlink / touch mtime；smoke source-forbidden-patterns 18 條 PASS） |
| dist/** / dist-promotion/** / dist-reports/** untouched | ✅（helper 從未讀寫該目錄） |
| deploy clone untouched | ✅（helper 完全不感知 deploy clone） |
| Blogger API 未呼叫 | ✅（無 fetch / http / googleapis / BloggerAPI；smoke source pattern PASS） |
| GA4 / Search Console / Drive API 未呼叫 | ✅（同上） |
| git push / commit / reset / checkout / restore / clean / rm / add -A 未觸發 | ✅（smoke `git write` pattern PASS） |
| child_process / exec / spawn 未使用 | ✅（helper 本身）；smoke 使用 spawn 執行 helper 屬 smoke 職責，helper 本體嚴禁 |
| package.json / package-lock.json 執行時未修改 | ✅（helper 完全不寫；只有本 commit 之 script 註冊為 additive 動 package.json） |
| `CLAUDE.md` / `MEMORY.md` / `memory/**` 未動 | ✅（本 slice commit range 完全排除） |

---

## 4. Behavior verification（本 slice 執行結果）

執行順序：先跑 helper（多種 arg combos）→ smoke → npm-script-targets → phase1-readiness →
release-readiness → validate:content → blogger-backfill → git status。所有指令皆於 source repo
root 執行；未進入 deploy clone。

| # | Command | Exit | 結果重點 |
| --- | --- | --- | --- |
| 1 | `node src/scripts/check-blogger-preview.js --help` | 0 | usage + pointers |
| 2 | `node src/scripts/check-blogger-preview.js` | 0 | list mode：8 candidates、6 filtered-out、0 missing-slug、0 parse-failure |
| 3 | `node src/scripts/check-blogger-preview.js --slug we-media-myself2` | 0 | 4 dist files exists；advice = complete |
| 4 | `node src/scripts/check-blogger-preview.js --slug zzz-unknown-slug-9x` | 0 | advice = not found among 8 / 6 |
| 5 | `node src/scripts/check-blogger-preview.js --slug we-media-myself2 --json` | 0 | JSON snapshot 可 parse |
| 6 | `npm run check:blogger-preview` | 0 | 同 #2（透過 npm script） |
| 7 | `npm run check:blogger-preview-smoke` | 0 | **49/49 PASS**：靜態 forbidden 18 條 + --help 3 條 + list 7 條 + focus known 6 條 + focus unknown 5 條 + no-write proof + determinism 5 條 + dist existence carry |
| 8 | `npm run check:npm-script-targets` | 0 | **59/59 PASS**（前 baseline 57/57；本 slice 新增 2 支 script × 1 .js target 各） |
| 9 | `npm run check:phase1-readiness` | 0 | 契約未動（validate:content / npm-script-targets 59/59 / adsense-mode-metadata / blogger-backfill 12→7→0→7→5 / download-indexing-independence 298/298 / prepublish 16/16 / smoke 8/8） |
| 10 | `npm run check:phase1-readiness-contract` | 0 | 23/23 PASS（forbidden token 未新增；helper 未進 umbrella） |
| 11 | `npm run check:release-readiness` | 0 | metadata-all 21/21 + prepublish 16/16 + smoke 8/8 + validate 0/135/107 |
| 12 | `npm run check:release-readiness-contract` | 0 | 14/14 PASS |
| 13 | `npm run validate:content` | 0 | 0 error / 135 warning / 107 post（本 slice 未動 content；不變） |
| 14 | `npm run check:blogger-backfill` | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（report-only；不動） |
| 15 | `git status --short` | — | 僅本 slice 之預期 4 檔（見 §5） |

實測數值以 §7 完整輸出為準。

---

## 5. 變更檔案

| 檔案 | 動作 | 說明 |
| --- | --- | --- |
| `src/scripts/check-blogger-preview.js` | 新增 | B1 navigator。list / focus / --json / --help / --dry-run 五 CLI shape。純讀 `content/**/*.md` + `dist-blogger/posts/<slug>/` fs.stat；不 writeFile / mkdir / rm / unlink / fetch / http / spawn / exec。 |
| `src/scripts/check-blogger-preview-smoke.js` | 新增 | Contract smoke。18 條 static forbidden-source patterns + 動態 4 種 CLI 場景 marker + no-write fingerprint + determinism（`--json` normalize mtime/size/note）+ dist existence carry。共 49 assertions。 |
| `package.json` | 修改（additive） | scripts 新增 `check:blogger-preview` + `check:blogger-preview-smoke`。 |
| `docs/20260712-preview-only-helper-implementation.md` | 新增 | 本檔（ledger）。 |

未動：`src/views/**` / `src/styles/**` / `src/js/**` / `src/scripts/build-*.js` /
`src/scripts/load-*.js` / `src/scripts/normalize-post-output.js` /
`src/scripts/admin-markdown-export.js` / `content/**` / `content/settings/**` / `.gitignore` /
`.git*` / `dist-blogger/**` / `dist/**` / `dist-promotion/**` / `dist-reports/**` /
`CLAUDE.md` / `MEMORY.md` / `memory/**` / package-lock.json / deploy clone。

---

## 6. Tests（smoke case 分類）

`check:blogger-preview-smoke` 49 assertions 分區：

- **Static source forbidden patterns（18）**：writeFile / appendFile / mkdir / rm / unlink /
  copyFile / rename / chmod / utimes / symlink / link / truncate / createWriteStream / fetch /
  http module / child_process / exec/spawn / googleapis / blogger api / git write
- **--help（3）**：exit 0 + 2 markers
- **List mode（7）**：exit 0 + 6 markers
- **Focus known-slug（6）**：exit 0 + 5 markers（含 dist path、advice header、PASS trailer）
- **Focus unknown-slug（5）**：exit 0 + 4 markers（含 not-found advice）
- **No-write proof（1）**：SHA-256 fingerprint `content/**/*.md` + `**/*.publish.json` before /
  after 全部 helper invocations（含 5 次 spawn）→ 逐檔對照相等
- **Determinism（5）**：兩次 `--json` invocation，normalize 掉 `mtimeIso` / `size` /
  `generatedAtNote` 後 JSON.stringify 應 byte-identical
- **Dist existence carry（1）**：helper 執行前後 `dist-blogger/` 存在性一致

Note：靜態 pattern 中包含 `child_process` 與 `exec/spawn`；smoke 本體使用 `child_process.spawn`
於 smoke script 內，故 pattern 只掃 helper 本體（`src/scripts/check-blogger-preview.js`），不掃
smoke 自身。此為刻意設計：smoke 需能生 child process 執行 helper，helper 本體嚴禁。

---

## 7. Baseline confirmation

（本 slice landing 後 carry-forward 一致；baseline 更新僅 `check:npm-script-targets` 由 57/57 升至
59/59；其餘 exit code / count 不變。）

```
validate:content:
  0 error
  135 warning
  107 post

check:phase1-readiness:                        exit 0
check:phase1-readiness-contract:               23/23 PASS
check:release-readiness:                       exit 0
check:release-readiness-contract:              14/14 PASS
check:metadata-all-contract:                   21/21 PASS
check:npm-script-targets:                      59/59 PASS   ← 本 slice 由 57/57 升
check:blogger-backfill:                        scanned 12 / candidates 7 / complete 0 /
                                               missing 7 / skipped 5 (report-only; exit 0)
check:download-indexing-independence:          298/298 PASS
check:download-indexing-generated-output:      21/21 PASS
check:download-indexing-dist-smoke:            20/20 PASS
check:github-pages-prepublish:                 16/16 PASS
check:github-pages-prepublish-smoke:           8/8 PASS
check:blogger-preview（NEW）:                  helper exit 0（read-only navigator; warning-only）
check:blogger-preview-smoke（NEW）:            49/49 PASS
```

---

## 8. Non-goals（本 slice 明確不做）

| 項目 | 狀態 |
| --- | --- |
| 動 `build:blogger` / `load-posts.js` / `classify` 契約 | ❌ 未動 |
| 動 `dist-blogger/`（含新增 / 修改 / 刪除 / touch mtime） | ❌ 未動 |
| B2 draft-aware preview build（新 `dist-blogger-preview/` + PREVIEW-ONLY 標記 + `.gitignore`） | ❌ 未做 |
| 動 `.gitignore` | ❌ 未動 |
| 動 `content/**` / `content/settings/**` / frontmatter / sidecar | ❌ 未動 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 進入 phase1-readiness / release-readiness umbrella | ❌ 未做（helper 保持 standalone；未來若接入須另開 phase） |
| 進入 metadata-all umbrella | ❌ 未做（helper 職責非 metadata guard） |
| 動 Blogger / AdSense / GA4 / Google Drive / Search Console 後台 | ❌ 未動 |
| Blogger backfill write / 猜任何真值 | ❌ 未做 |
| build / preview / deploy / push gh-pages / 動 `dist/` | ❌ 未做 |
| Reverse UTM pm-26 deploy | ❌ 未動 |
| Second GitHub Pages deploy / `github-pages-blog-planning` quarantine 解除 | ❌ 未動 |
| Custom domain / DNS / `CNAME` / `ads.txt` / AdSense formal application | ❌ 未做 |
| Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 | ❌ 未做 |

---

## 9. Awaiting Dean approval（未來延伸候選）

以下為未來 phase 之候選；本 slice **不代 Dean 決策**、**不主動啟動**：

- **接入 phase1-readiness / release-readiness umbrella**：目前 helper 為 standalone；若日後
  Dean 判斷 preview navigator 需列入 Phase 1 RC gate，須另開 phase + 更新兩支 contract guard 之
  REQUIRED_FRAGMENTS / ORDERED_FRAGMENTS。**本 slice 不接入**（per preanalysis §11.3 acceptance G-V3
  / G-V4）。
- **接入 metadata-all umbrella**：不建議；helper 語意非 metadata guard。
- **更新 runbook §D-6 / sanity checklist §5.0**：preanalysis §11.1 建議在 landing 後補 runbook /
  checklist 對照 pointer。**本 slice 保守未動兩份既有 doc**；若 Dean 認為 helper 應列為 optional /
  recommended，另開一小 slice docs-only 補 pointer 即可。
- **B2 draft-aware preview build**：draft 預覽不必動 frontmatter 之根治 flow；per preanalysis §6.2 /
  §11.2，收益中等 / 風險非零、須新 `dist-blogger-preview/` 目錄 + `.gitignore` 對齊 + PREVIEW-ONLY
  標記；**本 slice 不啟動**。
- **--dry-run 語意擴充**：本 slice `--dry-run` 為 no-op（navigator 本無寫入）。若日後 B2 落地，
  `--dry-run` 語意才有實質意義；本 slice 保留旗標形狀以利未來擴充。

---

## 10. 變更安全性

本 slice source mutation：
- **新增** `src/scripts/check-blogger-preview.js`（唯一新 helper）
- **新增** `src/scripts/check-blogger-preview-smoke.js`（唯一新 contract guard）
- **修改** `package.json` scripts（additive 2 條；未動其他 script、未改 dependencies / devDependencies）
- **新增** `docs/20260712-preview-only-helper-implementation.md`（本檔）

本 slice **不含**：任何 frontmatter / sidecar / settings / EJS / SCSS / JS / build / deploy /
dev-server 變更；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone；未 build / 未產
dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未新增測試文章 / artifact；未購買網域 / 未動
DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未
猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId`；未改任何 report-only
guard 為 fail-fast；未升 helper 之 warning 為 error。

Helper 之 no-write / no-external / determinism 三項不變式由 `check:blogger-preview-smoke` 之
49 assertions 靜態 + 動態 baseline 護。

---

## See also

- `docs/20260710-blogger-preview-only-script-preanalysis.md`（本 slice 之主 spec；B1 §6.1 / §7 allowed
  / §8 forbidden / §9 gates / §10 naming / §11.1 acceptance / §12 non-goals）
- `docs/20260710-phase1-rc-next-phase-route-selection.md` §3 Route D（B1 選定路徑；本 slice = §3 Route D
  之 B1 first slice）
- `docs/20260709-blog-phase2-next-work-packet.md` §C 候選 5（B1 之 preanalysis 前身；已由 preanalysis
  doc 落地）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步；helper 之 advice 指向
  §D-4 / §D-7）
- `docs/20260710-blogger-preview-sanity-analysis.md`（Blogger preview 40 項 sanity checklist；helper
  pointers 引用）
- `docs/20260710-blogger-admin-export-workflow-alignment.md`（Admin `#blogger-export` 資料源 audit；
  helper 沿用相同 source-driven 契約，不讀 dist 判定 candidate）
- `docs/20260710-blogger-backfill-write-phase-preflight.md`（Blogger backfill write phase preflight；
  helper 不動 backfill 語意；`check:blogger-backfill` 維持 report-only）
- `docs/20260710-custom-domain-adsense-trigger-checklist.md`（Custom domain / AdSense trigger
  checklist；helper 完全不觸 real AdSense IDs / GA4 IDs / DNS） 
- `src/scripts/check-blogger-preview.js`（helper 本體）
- `src/scripts/check-blogger-preview-smoke.js`（contract guard；49 assertions）
- `src/scripts/load-posts.js`（`classify` 單一事實來源；helper 沿用等價過濾規則）
- `src/scripts/load-blogger-posts.js`（既有 Blogger loader；helper 未透過此路徑以保留 filtered-out
  資訊給 diagnostic）
- `src/scripts/build-blogger.js`（產 `dist-blogger/posts/<slug>/` 4 檔；helper 讀該路徑）
- `src/scripts/check-npm-script-targets.js`（59/59 baseline；本 slice 由 57/57 升）
- `src/scripts/check-phase1-readiness-contract.js`（forbidden token / ordered fragment guard；
  本 slice 未進 umbrella）
- `src/scripts/check-release-readiness-contract.js`（同上；本 slice 未進 umbrella）
- `CLAUDE.md` §3a Current state snapshot（Red lines / Recommended next paths）
- `CLAUDE.md` §5（分階段）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、
  §27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source baseline）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊；
  本 slice 為 source-only）

---

（本文件結束 / end of document）
