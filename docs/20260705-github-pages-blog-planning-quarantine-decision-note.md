# 20260705-I github-pages-blog-planning quarantine decision note

- **Date**: 2026-07-05 (Asia/Taipei)
- **Type**: docs-only decision note（**不** 修改 content / frontmatter / status / draft / publishTargets / cover / body、**不** build / preview / deploy、**不** 碰 gh-pages、**不** 修改 `CLAUDE.md` / `MEMORY.md` / `memory/`）
- **Predecessor session**: `20260705-H github-pages-blog-planning quarantine reversal decision gate + final idle-freeze`（read-only decision gate；未動任何檔案；結論 = 維持 quarantined / draft）
- **Predecessor docs (context sources)**:
  - `docs/20260703-c1-e0-publish-scope-quarantine-plan.md` §3 / §4.1（quarantine 手段權威 + 逐篇 scope 建議）
  - `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`（quarantine 落地後 deploy scope recheck）
  - `docs/20260703-post-c1-next-deploy-candidates.md` §1 / §2.1 / §3 / §4（quarantine 標記為 blocked / online 404 by design）
  - `docs/20260704-c1-c1-verify-only-result.md`（verify-only 之 frozen baseline；build-readiness guards 全 PASS；deploy clone 未動）
  - `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md` §6.1 A（列為 Dean-gated candidate、非本 slice 推進對象）

---

## 1. Scope

本文件 **只是一份 decision note**，用來把 `20260705-H` session（read-only quarantine reversal decision gate）之結論落地為 cold-start 可讀之單一參考點：

- 明確登錄 `github-pages-blog-planning` **維持 quarantined / draft**。
- 明確登錄本 slice **不解除 quarantine**、**不改任何 content**、**不 build**、**不 deploy**。
- 明確登錄若 Dean 未來要推進，必須逐步另開 phase。

本 slice **唯一 mutation = 新增本檔一個 docs file**（透過單一 additive commit 記錄）。

本 slice **不推動、不批准、不執行**：

- content / frontmatter 修改
- `status` / `draft` / `publishTargets` / `cover` / body 修改
- prepublish check / build / preview / deploy / gh-pages / dev server
- Blogger / GA4 / AdSense / Search Console / Google Drive 後台動作
- Admin write path / Apply / middleware / admin-write-cli
- Reverse UTM pm-26 / FB sidecar 真實寫入
- `CLAUDE.md` / `MEMORY.md` / `memory/` 修改

所有實際發布 / un-hold 決策 **完全在 Dean**。

---

## 2. Frozen baseline used

Source repo（`/d/github/blog-new/portable-blog-system`；entry-of-session；本 slice 未動 baseline 值，只新增本檔）：

| 欄位 | 值 |
|---|---|
| branch | `main` |
| HEAD == origin/main | `5f64f5672e92340ea1e435b3d069b0ed79638738` |
| short | `5f64f56` |
| subject | `docs(publish): record post e next-line inventory` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |
| `CLAUDE.md wc -m` | 38328 |
| `CLAUDE.md wc -c` | 49967 |

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；read-only preflight；本 slice 未觸碰）：

| 欄位 | 值 |
|---|---|
| branch | `gh-pages` |
| HEAD == origin/gh-pages | `1170e7e14aaa7f3449999bf92b9c8586719a76b4` |
| short | `1170e7e` |
| subject | `deploy(github): publish first verified github pages scope` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

Baseline **matched** on entry；`CLAUDE.md` 仍在 40000 chars 管控線內。

---

## 3. Article inspected

- **Path**: `content/github/posts/20260504-github-pages-blog-planning.md`
- **slug**: `github-pages-blog-planning`
- **title**: `GitHub Pages 免費空間限制與部落格規劃`
- **titleEn**: `GitHub Pages Free Hosting Limits and Blog Planning`
- **contentKind**: `tech-note`
- **site**: `github`
- **primaryPlatform**: `github`
- **date**: `2026-05-04`
- **updated**: `2026-05-04`
- **status**: `draft`
- **draft**: `true`
- **canonical**: `auto`
- **publishTargets.github**: `enabled: true` / `mode: full`
- **publishTargets.blogger**: `enabled: true` / `mode: full`
- **cover**: `/images/placeholders/cover-placeholder.svg`（placeholder；非最終圖）
- **coverAlt**: `GitHub Pages 免費空間限制與部落格規劃 cover placeholder`
- **tags**: `[github, vite, static-site]`
- **body**（frontmatter 後之全文）: **1 行 scaffold placeholder**（`這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。`）
- 附掛 sidecar：`content/github/posts/20260504-github-pages-blog-planning.fb.md`（存在；本 slice 未讀 / 未動）

觀察：`publishTargets.github.enabled: true` 但 `status: draft` + `draft: true`，因此 loader 過濾規則（native github post 只看 `status` / `draft`；per `docs/20260703-c1-e0-publish-scope-quarantine-plan.md` §3 表格）將完全排除 build / sitemap / listing，符合 C1 quarantine 設計。

---

## 4. Current quarantine status

- **Quarantine state**：🔴 **quarantined**。
- **落地方式**：`status: ready → draft` + `draft: false → true`（C1 quarantine flip；per `docs/20260703-c1-e0-publish-scope-quarantine-plan.md` §4.1 建議、於 first GitHub Pages deploy 前完成）。
- **落地 commit（回顧）**：`94385b1`（per `CLAUDE.md` §3a first GitHub Pages deploy milestone 記錄）。
- **Live 現況**：online **404 by design**（per `docs/20260703-post-c1-next-deploy-candidates.md` §1 / `CLAUDE.md` §3a milestone 段）；build 排除 → sitemap 排除 → listing 排除；orphan / stale / canary 皆 absent。
- **20260705-H 結論**：read-only quarantine reversal decision gate 完成；`github-pages-blog-planning` **維持 quarantined / draft**；scaffold placeholder body 維持未發布；無 files changed / no docs added / no commit / no push / no build / no preview / no deploy / deploy clone untouched / `CLAUDE.md` untouched。
- **本 slice（20260705-I）結論**：**不解除 quarantine**；只新增本 decision note，記錄前述結論。

---

## 5. Why quarantine remains correct

以下理由承接 `docs/20260703-c1-e0-publish-scope-quarantine-plan.md` §4.1 之判定，並經 `20260705-H` read-only 檢視後仍成立：

1. **Body 仍為 scaffold placeholder**：全文只有 1 行 scaffold 佔位句（`這是一篇初始化範例文章。Phase 1 會建立 Markdown 讀取與 frontmatter 解析。`），無任何實質內容、無標題以下之段落、無 GitHub Pages 免費空間限制之技術資料、無部落格規劃論述。與 title 承諾（`GitHub Pages 免費空間限制與部落格規劃`）**嚴重不符**。
2. **對外品質風險**：若上線，訪客會看到「標題像技術長文、內文 1 句廢話」之落差，直接損及站台內容誠信與品牌信任。
3. **SEO 品質風險**：極短 body + placeholder cover + placeholder body 內容，若被 crawler index，可能被 Google 判為 low-quality / thin content，甚至影響同站其他文章之搜尋表現。
4. **C1 quarantine 為刻意設計**：C1 line first GitHub Pages deploy 之 quarantine 名單經 `docs/20260703-c1-e0-publish-scope-quarantine-plan.md` §4.1 逐篇分析後決定；online 404 **by design**，非疏漏、非缺 build、非部署失敗。
5. **Quarantine 手段語意正確**：native github post 要「完全不上線」，權威手段為 `draft: true` 或 `archived`（per §3 表格）；此篇從未有真實內容、非退役，故 `draft` 較 `archived` 貼切（per §4.1 判定）。
6. **無迫使解除之外部壓力**：目前沒有 Blogger 反向連結指向此 GitHub URL、沒有 GA4 / AdSense / Search Console 觀察需求、沒有 SEO 收益期待。維持 online 404 對整體站台無負面影響。

---

## 6. Public-readiness blockers

若 Dean 未來考慮上線，以下為 **必須先解決** 的公開性 blockers（本 slice **不** 解決任一項；僅列示）：

- 🔴 **Body 內容尚未撰寫**：需 Dean 撰寫真實正文，涵蓋 title 承諾之範圍（GitHub Pages 免費空間限制 + 可搬家部落格規劃）；scaffold placeholder 句必須替換。
- 🔴 **Cover 為 placeholder**：`cover: "/images/placeholders/cover-placeholder.svg"`；若對外，建議補真實 cover（非硬性阻擋，但 advisory）。
- 🟡 **Blogger cross-mirror 決策**：`publishTargets.blogger.enabled: true` + `mode: full` 目前仍設定為 full；若 Dean 決定上線，需同時決定是否維持 Blogger cross-mirror；若不維持，須手動 flip。
- 🟡 **Date / updated 檢視**：`date` / `updated` 皆 `2026-05-04`；若真實撰寫落在其他日期，需 Dean 決定是否 update。
- 🟡 **canonical**：`canonical: "auto"`；若 Blogger cross-mirror 保留，`primaryPlatform: github` 已定調 canonical 走 GitHub；若要調整，需 Dean 決定。
- 🟢 **tags 已填**：`[github, vite, static-site]` 已填 registry-valid tag id；非 blocker。
- 🟢 **frontmatter 語法**：現有 frontmatter 語法本身合規；非 blocker。

**再次強調**：本 slice 未修改任何欄位；上述 blockers 僅為 decision-note 記錄用，供 Dean 未來評估參考。

---

## 7. Dean decisions required before any un-hold

若 Dean 未來要考慮 un-hold `github-pages-blog-planning`，以下為 **每項均需 Dean explicit approval** 之獨立決策（依先後順序）：

1. **Content rewrite 決策**：是否要撰寫真實正文？若是，走 content rewrite phase（Claude 不代為決定 body 內容；由 Dean 撰寫或指示）。
2. **Blogger cross-mirror 決策**：`publishTargets.blogger` 是否維持 `enabled: true` / `mode: full`？或改 `false` / `summary` / `redirect-card`？
3. **Cover / date / canonical 決策**：cover 是否補真實圖？date / updated 是否更新？canonical 是否維持 auto？
4. **Quarantine flip 決策**：`status: draft → ready` + `draft: true → false`？（此為 un-hold 核心動作；未 Dean 明確授權前不執行）
5. **Prepublish guard 決策**：是否重跑 `npm run check:github-pages-prepublish` + `check:github-pages-prepublish-smoke`（16/16 + 8/8 期望）？
6. **Build 決策**：是否執行 `npm run build:github`（含 `build:blogger` / `build:sitemap` 視 Blogger cross-mirror 決策而定）？
7. **Preview 決策**：是否執行 `npm run preview` 本機檢視？
8. **Deploy 決策**：是否進入 deploy clone（`/d/github/blog-new/portable-blog-deploy`）+ push gh-pages？
9. **Online 驗收決策**：是否 Dean 手動開啟 `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/`（假設 slug 不變）確認 online 200 + 內容正確？

以上每一步 **均需 Dean explicit approval**；Claude 不代為選擇、不代為 flip、不代為 build、不代為 deploy、不代為 online 驗收。

---

## 8. If Dean later wants to publish

若 Dean 未來決定推進，**必須另開 phase**，且 phase 需嚴格分離（避免混搭）：

- **Phase A（content rewrite / real body）**：只改 body 內容 + 相關 frontmatter（cover / description / searchDescription 等）；不 flip `status` / `draft` / `publishTargets`；不 build。
- **Phase B（frontmatter un-hold）**：只 flip `status: draft → ready` + `draft: true → false`；不 build。
- **Phase C（prepublish guard only）**：只跑 read-only prepublish guards；不 build / 不 deploy。
- **Phase D（build only）**：只跑 `npm run build:github`（視 Blogger cross-mirror 決策決定是否含 `build:blogger` / `build:sitemap`）；不 preview / 不 deploy。
- **Phase E（preview only）**：只跑 `npm run preview`；不 deploy。
- **Phase F（deploy / gh-pages）**：進入 deploy clone；push gh-pages；per `docs/github-deploy.md` F-01 runbook。
- **Phase G（online verification）**：Dean 手動 online 驗收。

**上述順序為建議最保守之分階段路徑；不代表 Dean 必須全走完；不代表 Claude 可代為推進。** 每 phase 均需 Dean explicit approval。

**本檔 §8 不是 action plan、不是 checklist、不是 runbook；僅為 decision-note 之未來路徑提醒。**

---

## 9. What this slice intentionally does not change

本 slice 唯一 mutation = 新增本檔 `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（透過單一 additive commit 記錄）。

明確 **未變更 / 未執行** 之清單：

- ❌ 未修改 `content/github/posts/20260504-github-pages-blog-planning.md`（含 frontmatter / body / cover / status / draft / publishTargets / canonical / date / updated / tags / description / searchDescription）
- ❌ 未修改 `content/github/posts/20260504-github-pages-blog-planning.fb.md`
- ❌ 未修改 `content/**`（其餘任何檔案）
- ❌ 未 flip 任何文章之 `status` / `draft` / `publishTargets` / `blogger.status` / `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`
- ❌ 未修改 `content/settings/**`
- ❌ 未修改 `src/**`（含 `src/scripts/**` / `src/js/**` / `src/views/**` / `src/styles/**`）
- ❌ 未修改 `views/**` / `public/**`
- ❌ 未修改 `package.json` / `package-lock.json`
- ❌ 未修改 `CLAUDE.md`（保持 38328 chars / 49967 bytes；遵守 40000 chars 管控線）
- ❌ 未修改 `MEMORY.md` / `memory/**`
- ❌ 未修改 `docs/20260703-c1-e0-publish-scope-quarantine-plan.md`
- ❌ 未修改 `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`
- ❌ 未修改 `docs/20260703-post-c1-next-deploy-candidates.md`
- ❌ 未修改 `docs/20260704-c1-c1-verify-only-result.md`
- ❌ 未修改 `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`
- ❌ 未修改 `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`
- ❌ 未修改任何其他既有 docs file
- ❌ 未執行 `npm run dev` / `preview`
- ❌ 未執行 `npm run build*` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`
- ❌ 未執行 `npm run validate:content` 或任何 check guard（carry-forward `CLAUDE.md` §3a Validation baseline）
- ❌ 未觸碰 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ 未觸碰 deploy clone `/d/github/blog-new/portable-blog-deploy`（仍 `1170e7e` / clean / 0/0）
- ❌ 未 push gh-pages / 未 deploy
- ❌ 未動 Blogger 後台 / GA4 / AdSense / Search Console / Google Drive
- ❌ 未 `npm install` / 未動 dependency / 未動 lockfile
- ❌ 未新增 devDependency（無 Playwright / 無測試框架變更）
- ❌ 未解除 `github-pages-blog-planning` quarantine
- ❌ 未推進 Admin write path / Reverse UTM pm-26 / FB sidecar 真實寫入

---

## 10. Final status

**Decision note only.** 本檔記錄 `20260705-H` read-only quarantine reversal decision gate 之結論：`github-pages-blog-planning` **維持 quarantined / draft**；scaffold placeholder body 維持未發布；online 404 by design 維持；quarantine flip commit `94385b1` 之效果維持有效。

**Default next action = keep quarantined / no-op / Dean-gated.** Claude 不代為選擇解除路徑、不代為 flip、不代為 build、不代為 deploy。若 Dean 未來決定推進，須依 §7 逐項決策 + §8 分階段 phase 展開，每步均需 explicit approval。

本檔於下一個 Dean-gated phase 啟動前，**不需要再更新**；若 Dean 開啟推進 phase（content rewrite / un-hold / build / preview / deploy），該 phase 會產出自己的 ledger doc，本檔僅於 cross-links 被引用即可。

---

## 11. Cross-links

- `docs/20260703-c1-e0-publish-scope-quarantine-plan.md` §3 / §4.1（quarantine 手段權威 + 本篇 quarantine 判定源頭）
- `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`（quarantine 落地後 deploy scope recheck）
- `docs/20260703-post-c1-next-deploy-candidates.md` §1 / §2.1 / §3 / §4（quarantine 標記為 blocked、online 404 by design、un-hold 需 Dean explicit approval）
- `docs/20260704-c1-c1-verify-only-result.md`（verify-only frozen baseline；build-readiness guards 全 PASS）
- `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md` §6.1 A（列為 Dean-gated candidate；本 slice 不推進）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（若 Dean 未來推進，§4 pre-publish gate 為權威）
- `docs/github-deploy.md`（F-01 deploy runbook；若 Dean 未來執行 §8 Phase F 使用）
- `docs/publish-workflow.md` §3–§4（build order authority）
- `CLAUDE.md` §3a Current state snapshot / Core operating rules / Validation baseline / Red lines / first GitHub Pages deploy milestone

---

（本文件結束 / end of document）
