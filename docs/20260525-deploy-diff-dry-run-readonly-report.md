# Deploy Diff Dry-Run Read-Only Report

Phase: `20260525-night-8-deploy-diff-dry-run-readonly-report-a`
Date: 2026-05-25
Scope: docs-only

---

## §A. 文件目的

本文件為 **read-only deploy diff audit** 之收尾紀錄。

明確聲明：

- ❌ **本文件不是 deploy report**；本批未 deploy gh-pages、未 push、未碰 deploy artifact。
- ❌ **本文件不代表 pm-26 已啟動**；reverse UTM live 狀態維持 🟡 **landed but dormant**，無 production state 變更。
- ❌ **本文件不變更任何 src / content / settings / dist / .cache / Blogger / GA4**；屬純 docs-only audit snapshot。
- ✅ 目的：將 5/25 night-7 read-only deploy diff audit（依 `20260525-night-7-deploy-diff-dry-run-readonly-a` phase 執行）之結果落地為 docs，供未來 cold-start session / deploy decision 直接讀取，避免重做 audit。

本文件**不**取代以下既有 reverse UTM canonical 文件；僅為其 pre-deploy entry index：

- `CLAUDE.md` §16.4（reverse UTM 規格主錨）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12 + §0 status update）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 addendum）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（L1 smoke 完成）
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（pm-25 verify 結果）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（pm-26 pre-flight readiness）

---

## §B. Baseline（pm-25/pm-26/L1 smoke 收尾後 freeze 狀態）

| 檢查 | 結果 |
|---|---|
| `git status --short --branch` | `## main...origin/main`（working tree clean） |
| `git rev-parse HEAD` | `31c7b41ec64de517361fcf726106a413699cba74`（short `31c7b41`） |
| `git rev-parse origin/main` | `31c7b41ec64de517361fcf726106a413699cba74` |
| HEAD ≡ origin/main | ✅ 是 |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0`（ahead/behind 0/0） |
| `npm run smoke:reverse-utm` | ✅ `reverse UTM L1 smoke passed`，exit 0 |

→ baseline 完全對齊 pm-26 pre-flight readiness（night-6）落地後之 freeze 狀態；本批 audit 與 docs 落地不改變此狀態。

---

## §C. Branch / Remote 狀態

執行 `git branch --all` 結果：

```
* main
  remotes/origin/HEAD     -> origin/gh-pages
  remotes/origin/gh-pages
  remotes/origin/main
```

| 分支 | 最新 commit | 角色 |
|---|---|---|
| `main`（local）| `31c7b41` | source 開發線；與 origin/main 完全同步（0/0） |
| `origin/main` | `31c7b41` | source 線 remote head |
| `origin/gh-pages` | `c36b84f` | live deploy 線 head |
| `origin/HEAD` | → `origin/gh-pages` | 預設 remote head 指向 deploy 線（**非** main） |

關鍵事實：

- `origin/gh-pages` 最新 commit **subject** = `deploy: b94cf77 snapshot`
- 反推：上一次 deploy 之 source snapshot SHA = `b94cf77`
- `git merge-base --is-ancestor b94cf77 main` → ✅ **`b94cf77` IS ancestor of main**（deploy 線無 fork、無 rebase；linear ancestry holds）
- `b94cf77` commit subject = `fix(ga4): add placement params to related and other links`

⚠️ 本專案的 `origin/HEAD` 指向 `gh-pages` 而非 `main`（per project CLAUDE.md 開頭亦明示 "Main branch (you will usually use this for PRs): gh-pages"），與一般 source-on-main / CI-deploys 模型不同；`gh-pages` 為 deploy artifact 線，由獨立 deploy SOP 推進（per `docs/reverse-utm-fixture-plan.md` §10.7 暗示之 sibling repo `portable-blog-deploy/`；本 audit 未讀 deploy SOP 細節）。

---

## §D. Source main vs Deploy gh-pages 差異

### §D.1 主數字

| 項目 | 值 |
|---|---|
| deploy snapshot source（gh-pages 之來源 main commit） | `b94cf77` |
| current main HEAD | `31c7b41` |
| `git rev-list --count b94cf77..main` | **78** |

→ main **領先 deploy snapshot 78 個 commit**；linear ancestry，無 fork。

### §D.2 78 commits 分類盤點

依本 audit 對 `git log --oneline b94cf77..main` 之 78 筆掃描歸納為 8 類：

| # | 類別 | 性質 | 代表 commits |
|---|---|---|---|
| 1 | **reverse UTM source（核心）** | source 邏輯 | `7e1d356`（pm-24a 新增 `isGithubCrossLink` / `applyCrossSiteUtm` `direction='to_github'` 參數）／ `e2309e9`（pm-24b `build-blogger.js` 新增 `deriveRenderedCrossLinks`）／ `7c769fe`（pm-24c `blogger-post-full.ejs` 讀 rendered cross-links） |
| 2 | **reverse UTM docs / L1 smoke / pm-25 / pm-26 readiness** | docs | `feb8635` / `1560092` / `a38398c` / `143c0c6` / `c49ec37` / `ba77c93` / `28ce1b1` / `74ed1a2` / `ea9d7ba` / `fc2a852` / `058ebce` / `0a23bf8` / `72ee459` / `0b62a13` / `7bdfb3a` / `dcb0939` / `2470deb` / `6b85ecf`（L1 smoke plan）／ `81bf950`（L1 smoke harness source）／ `0d6ac84`（L1 smoke npm script）／ `e4feb33`（L1 smoke completion report）／ `eb42e00`（pm-25 verify report）／ `31c7b41`（pm-26 pre-flight readiness checklist） |
| 3 | **GA4 link tracking 規格 / 修正** | source + docs | `e6f0a5f`（prioritize cross-site link_type derivation）／ `93fec24`（define link_type derivation rule）／ `c783c3e`（audit link_type root cause for related links）／ `073647a`（align affiliate placement enum）／ `32f042a`（audit click tracking coverage）／ `be44701`（stabilize link tracking spec for 20260523） |
| 4 | **admin overview UI** | source + docs | `f3ac5ca`（show relative published time）／ `fa98b00`（split missing output url stats）／ `4e160bf`（overview b-series decision prep）／ `2df85e2`（add fbPostedAt sort option）／ `46ae0e9`（sync b4 fbPostedAt sort audit status）／ `b59a004`（mark b5 sort indicator optional）／ `c7522e2`（sync a4 a5 a6 audit status）／ `16bc610`（sync a1 a2 filter audit status）／ `b30f70b`（sync a7 empty filter audit status）／ `53bf60c`（add empty state for zero-matched filters）／ `b9b76c6`（group fb badge filter options）／ `f7dd897`（group source site filter options）／ `90d81ce`（mark url linkify audit item completed）／ `430ecb0`（add 20260523 overview audit）／ `c090fa3`（clarify read-only boundary in phase 1 guide） |
| 5 | **content schema / template / new-post** | source + docs | `b409580`（refresh related-links validate baseline to 0/39/34）／ `38aef37`（add magazine review link placeholders）／ `cff4de3`（explain github primary template selection）／ `82ab523`（clarify series sample is not full post）／ `a4e2f94`（clarify blogger summary template scope）／ `4e72ce8`（align blogger download template schema）／ `4fff8e4`（align new-post path hint with post filename convention）／ `ab942ca`（clarify new-post stdout-only flow in phase 1 guide）／ `899fdf6`（add book review ready checklist） |
| 6 | **draft content（不會 export）** | content | `70a697d`（add blogger book-review draft skeleton）／ `efe40b9`（add publish sidecar for blogger book-review draft）／ `7e7102b`（add fb sidecar for blogger book-review draft）／ `afcf6fc`（record sidecar build smoke checkpoint） |
| 7 | **hashtag wrap fix** | source | `0f71d6e`（allow long hashtag text wrapping） |
| 8 | **大量 docs / reports / handoff / audit / runbook** | docs | `d6a8922` / `dc167a6` / `d13174f` / `65145a8` / `939d97a` / `50a5b24` / `e0c87b4` / `14f861e` / `581c0a1` / `5ab7c05` / `e874acc` / `a2d285a` / `76872a5` / `d8e54eb` / `066d351` / `762386a` / `62b7298` |

→ 78 commits 中：

- 屬 **reverse UTM 直接相關**（類 1 + 類 2）= 約 23 commits
- 屬 **非 reverse UTM 但 user-visible** 之 source 改動（類 3 + 類 4 + 類 5 + 類 7）= 約 30 commits
- 屬 **draft content + 大量 docs**（類 6 + 類 8）= 約 25 commits

---

## §E. Reverse UTM Deploy 狀態（精準）

### §E.1 三個 reverse UTM source commits 之 deploy 狀態

| commit | subject | 在 main？ | 在 deploy snapshot `b94cf77` 之歷史中？ |
|---|---|---|---|
| `7e1d356` | `fix(ga4): add blogger to github cross-site utm helper` | ✅ 是 | ❌ **否**（在 `b94cf77..main` 之 78 筆內） |
| `e2309e9` | `fix(ga4): prepare blogger reverse utm cross links` | ✅ 是 | ❌ **否**（同上） |
| `7c769fe` | `fix(ga4): wire blogger reverse utm cross links` | ✅ 是 | ❌ **否**（同上） |

### §E.2 結論

✅ **三個 reverse UTM source commits 確定僅在 main，尚未 reflected 到 gh-pages**。

對齊以下既有文件之規格與狀態描述：

- `CLAUDE.md` §16.4 reverse 方向段落 → **"source landed; un-deployed; live but dormant"** 描述準確；no drift
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md` §H **"dormant 維持"** 結論成立
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §B 之 live 狀態 🟡 **landed but dormant** 對齊
- `docs/blogger-to-github-reverse-utm-plan.md` §0 / §10 對於 pm-24a/b/c 之記錄成立

reverse UTM live 狀態自 5/23 pm-24 source landing 以來，**production state drift = 0**。

---

## §F. 為何目前仍不建議啟動 pm-26

### §F.1 fixture 缺席（root cause）

| 維度 | 結果（per pm-25 verify §D + pm-26 readiness §C） |
|---|---|
| 全部 ready posts | 3 篇（`we-media-myself2` full + `github-pages-blog-planning` summary + `portable-blog-system-mvp` summary） |
| `bloggerMode: 'full'` 之 ready post（reverse UTM 唯一 caller `renderFullPost`） | **1 篇**（`we-media-myself2`） |
| 該 post `relatedLinks` 內含 GitHub Pages cross-link？ | ❌ 否（唯一 relatedLinks 為 Blogger-internal `https://babel-lab.blogspot.com/2026/04/we-media-myself.html`，`kind: internal`） |
| 該 post `otherLinks` 內含 GitHub Pages cross-link？ | ❌ 否（`otherLinks: []`） |
| `content/blogger/` 是否存在任何 `babel-lab.github.io` 引用 | ❌ 否（grep 0 命中） |
| **正向 reverse UTM fixture 存在？** | ❌ **不存在** |

### §F.2 即使現在 deploy，會發生什麼

| 維度 | 預期結果 |
|---|---|
| gh-pages source snapshot 推進 `b94cf77` → `31c7b41` | ✅ source 線推進；deploy artifact 同步 |
| GitHub Pages 線上文章內容更新（reverse UTM source 邏輯入 production runtime） | ✅ 但無 content 會觸發 reverse UTM render path |
| Blogger 後台同步 | ❌ deploy 不會碰 Blogger；仍需 user 手動重貼 |
| Blogger live post 內**任一**連結帶 reverse UTM 跳 GitHub Pages | ❌ **零個** — `we-media-myself2` Blogger post 內無 GitHub cross-link 可點 |
| GA4 Realtime 看得到 `utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` | ❌ **0 命中** — 無 fixture = 無流量入口 |

### §F.3 GA4 0 命中之歸因不可分辨問題

若強行 deploy + 重貼 + 觀察 GA4 而見 0 命中，**無法判斷**是以下哪個原因：

- 🟡 fixture 缺（root cause，本批已確認）
- 🟡 廣告阻擋器
- 🟡 Blogger CDN cache
- 🟡 source bug

→ 浪費 user 手動重貼成本（per `docs/20260524-blogger-repost-checklist.md` §3 之 ~15 step / 5-10 分鐘 / CDN 等候 5-10 分鐘）+ 無診斷價值。

### §F.4 結論

⛔ **若僅為驗 reverse UTM，不建議 deploy**；維持 dormant 之風險為 0，pm-26 啟動條件不成立（per `docs/reverse-utm-fixture-plan.md` §6 條件 1 未滿足）。

---

## §G. 未來若正式 Deploy 之合理流程（11 步；不執行）

依 `docs/reverse-utm-fixture-plan.md` §10.5 + `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §E：

| # | 步驟 | 對應 phase | 動作性質 |
|---|---|---|---|
| 1 | **cold-start baseline 確認** | n/a | `git status --short --branch` / `git rev-parse HEAD` / `git rev-list --left-right --count origin/main...HEAD`；要求 clean + sync |
| 2 | **`npm run smoke:reverse-utm`** | n/a | L1 source-level smoke；exit 0 = pass；exit 非 0 立即停下 |
| 3 | **確認 positive fixture 存在** | fixture-plan Phase 1 之後 | grep `content/blogger/posts/*.md` frontmatter `status: ready` + `publishTargets.blogger.mode: 'full'` + 對應 `babel-lab.github.io` cross-link |
| 4 | **`npm run build:blogger`** | fixture-plan Phase 2 | build dist-blogger；確認無 warning + ready count 對齊 |
| 5 | **`npm run build:github`** | fixture-plan Phase 2 | build dist；確認 forward UTM 不受影響 |
| 6 | **grep `dist-blogger/posts/{slug}/post.html`** | fixture-plan Phase 2 | 用 `rg --no-ignore` 驗 reverse UTM 4 鍵命中（`utm_source=blogger` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links\|other_links`）+ target/rel 合併（`target="_blank"` + `rel` 含 `nofollow noopener noreferrer`）+ legacy `internal_referral`/`blogger_to_github` scheme 不變 |
| 7 | **若 dist 驗證通過 → 才進 deploy** | gate | dist 不過 = 不 deploy；source 修正後重 build 重驗 |
| 8 | **deploy gh-pages**（user 手動） | fixture-plan Phase 3 後 | per `docs/20260524-blogger-github-publishing-runbook.md` 之 deploy SOP |
| 9 | **user 手動重貼 Blogger 文章** | fixture-plan Phase 4 | per `docs/20260524-blogger-repost-checklist.md` §2.2（備份）+ §3（重貼步驟）；後續回填 `.publish.json` 之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`；等待 Blogger CDN cache 5-10 分鐘 |
| 10 | **user 進 GA4 Realtime 驗收** | fixture-plan Phase 5 | per `docs/20260524-ga4-reverse-utm-observation.md` §4.2；Chrome 無痕（或 GA Debug Mode）開啟 Blogger 重貼後文章 → 點擊 GitHub cross-link → GA4 Realtime / DebugView 觀察 4 鍵 reverse UTM；延遲 < 30s；Reports 24-48 小時 |
| 11 | **新增 verification report** | fixture-plan Phase 6 | 新增 `docs/{date}-reverse-utm-fixture-verification-report.md`；若需更新 `CLAUDE.md` §16.4 之 dormant → live 狀態，另開獨立 docs phase |

phase 間依賴：

```
Phase 1 content → Phase 2 build verify → Phase 3 commit + push
                                              │
                                              ↓
Phase 4 Blogger repost → Phase 5 GA4 observe → Phase 6 verification report
```

⚠️ `package.json` 沒有 `deploy` script，亦無 CI 自動 deploy；deploy 屬獨立 SOP，本 audit 未讀其細節。

---

## §H. 下一步選項

| 選項 | 動作 | 何時觸發 | 推薦 |
|---|---|---|---|
| **A** | 維持 dormant + 等自然 fixture | 等下一篇自然書評 / 心得文章主題自然涉及「網站製作 / 部落格策略 / AI 工具」時，順便在 relatedLinks 引用 GitHub 站既有技術文 → fixture 自然落地 | 🟢 **推薦**；無時間壓力、無風險、production-grade 真實 |
| **B** | user 自決主動製造 fixture，另開 L2 fixture phase | user 若評估「reverse UTM 驗收價值 > 寫新文章成本」可選用；依 `docs/reverse-utm-fixture-plan.md` §10.5 Phase 1-6 流程 | 🟡 副軌；非本 audit 範圍 |
| **C** | 若純為同步 78 個非 reverse UTM 改動，另開獨立 deploy phase | 動機：把 GA4 link tracking 修正 / admin overview UI / content schema / hashtag wrap fix 等 user-visible 改動推 production；reverse UTM 順便進 runtime 但繼續維持 dormant；此時 GA4 reverse UTM 仍 0 命中，**接受此 trade-off** 才走 | 🟡 獨立議題；**這不是 reverse UTM pm-26** |
| **D** | 本 report docs-only commit 後收工 | 完成本 phase 落地 | 🟢 **本 phase 唯一目標** |

⚠️ A 與 D 不互斥；A 為長期路線，D 為本 phase 收尾。C 若選用，須另開 phase + 明確聲明「不是為驗 reverse UTM」之動機。

---

## §I. 明確不做事項（本批落地保證）

| 項目 | 狀態 |
|---|---|
| 新增 `docs/20260525-deploy-diff-dry-run-readonly-report.md`（本檔） | ✅ 唯一新增檔案 |
| 修改 `src/` | ❌ 無 |
| 修改 `content/`（任何 `.md` / `.publish.json` / `.fb.md`） | ❌ 無 |
| 修改 `content/settings/` | ❌ 無 |
| 修改 `package.json` | ❌ 無 |
| 修改 `.claude/` | ❌ 無 |
| 修改 `CLAUDE.md` | ❌ 無 |
| 修改其他既有 docs（含 reverse-utm-fixture-plan.md / blogger-to-github-reverse-utm-plan.md / pm-25 verify report / pm-26 readiness checklist / L1 smoke completion report / blogger-repost-checklist / ga4-reverse-utm-observation） | ❌ 無 |
| `npm run build` / `npm run build:blogger` / `npm run build:github` / `npm run build:promotion` / `npm run build:sitemap` | ❌ 本批不執行 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/` | ❌ 無 |
| 切換到 `gh-pages` branch | ❌ 無（只用 `git log` / `git rev-parse` / `git merge-base --is-ancestor` 讀 remote reference） |
| Deploy gh-pages | ❌ 無 |
| git push | ❌ 無 |
| git reset / git rebase / git push --force | ❌ 無 |
| 操作 Blogger 後台（重貼 / 改內容 / 改 Theme CSS） | ❌ 無 |
| 操作 GA4 後台（改 measurement ID / 改 channel grouping / 改 audience） | ❌ 無 |
| 新增 fixture（`content/blogger/posts/{date}-{slug}.md` 或 `.publish.json`） | ❌ 無 |
| 啟動 pm-26（per fixture-plan §6 啟動條件） | ❌ 無 |
| 啟動 L2 fixture phase | ❌ 無 |
| 更新 `CLAUDE.md` §16.4 之 live state（dormant → live） | ❌ 無 |

本文件落地後 reverse UTM live 狀態維持 🟡 **landed but dormant**；無 production state drift。

---

## §J. Cross-links

### §J.1 reverse UTM 三層 canonical 詳本

- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-site UTM 規則；reverse 方向 source landed but dormant）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12 + §0 status update）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 readiness addendum）

### §J.2 5/25 reverse UTM 日內 docs trail

- `docs/20260525-reverse-utm-readiness-snapshot.md`（am-8；本日 readiness 狀態紀錄）
- `docs/20260525-reverse-utm-code-smoke-plan.md`（night-4 之前；L1 smoke plan）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（night-4；L1 smoke completion；commits `6b85ecf` / `81bf950` / `0d6ac84`）
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（night-5；pm-25 pre-deploy verify report；commit `eb42e00`）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（night-6；pm-26 pre-flight readiness checklist；commit `31c7b41`）
- 本檔（night-8；deploy diff dry-run read-only report；待 commit）

### §J.3 user 手動操作 SOP

- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM dormant → live 長期觀察指引）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）

### §J.4 規格錨點

- `docs/click-tracking-governance.md` §4 row 3 / §10 順序 5（reverse UTM 規格）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；source landed；dormant）
- `docs/ga4-parameter-naming-registry.md` §4.2（reverse UTM 命名規格）
- `docs/blogger-listener-strategy.md` §5.1（短期推薦方案 D — reverse UTM；listener 短期不做）

---

（本文件結束）
