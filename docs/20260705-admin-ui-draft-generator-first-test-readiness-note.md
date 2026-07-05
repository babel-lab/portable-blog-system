# 20260705-C admin-ui-draft-generator-first-test readiness note

- **Date**: 2026-07-05 (Asia/Taipei)
- **Type**: docs-only decision note (no content / no build / no deploy)
- **Scope target**: `content/github/posts/2026-06-29-admin-ui-draft-generator-first-test.md`
- **Predecessor context**: `docs/20260703-post-c1-next-deploy-candidates.md` §2.1 (medium candidate row) / `docs/20260704-c1-c1-verify-only-result.md` (frozen verify baseline)

---

## 1. Scope

本文件 **只是一份 decision note**，用來把 `admin-ui-draft-generator-first-test` 這一篇 GitHub Pages medium candidate 目前的公開 readiness / 未決事項 / blocker 集中整理，讓 Dean 決策時有單一 anchor 可讀。

本文件 **不推動、不批准、不執行** 任何：

- content / frontmatter 修改
- status flip（draft → ready / published）
- publishTargets 修改
- build / preview / deploy / gh-pages / dev server
- Blogger / GA4 / AdSense / Search Console / Google Drive 後台動作
- Admin write path / Apply / middleware / admin-write-cli

決策仍然完全在 Dean。

---

## 2. Baseline (entry; unchanged by this slice)

Source repo (`/d/github/blog-new/portable-blog-system`):

| 欄位 | 值 |
|---|---|
| branch | `main` |
| HEAD == origin/main | `5bee02de3b97dea1c876f6a6ef1d75cf72132e90` |
| short | `5bee02d` |
| subject | `docs(publish): record c1-c1 verify-only baseline` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |
| `CLAUDE.md wc -m` | 38328 |
| `CLAUDE.md wc -c` | 49967 |

Deploy clone (`/d/github/blog-new/portable-blog-deploy`; read-only preflight):

| 欄位 | 值 |
|---|---|
| branch | `gh-pages` |
| HEAD == origin/gh-pages | `1170e7e14aaa7f3449999bf92b9c8586719a76b4` |
| short | `1170e7e` |
| subject | `deploy(github): publish first verified github pages scope` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

Baseline 與 20260704 C1-C1 verify-only 完全一致；本 slice 未觸碰 deploy clone。

---

## 3. Article inspected

| 欄位 | 觀察值 |
|---|---|
| path | `content/github/posts/2026-06-29-admin-ui-draft-generator-first-test.md` |
| id | `20260629-admin-ui-draft-generator-first-test` |
| site | `github` |
| contentKind | `tech-note` |
| primaryPlatform | `github` |
| title | `Admin UI 草稿產生器第一次實測紀錄` |
| titleEn | `Admin UI Draft Generator First Test Notes` |
| slug | `admin-ui-draft-generator-first-test` |
| date | `2026-06-29` |
| updated | `2026-06-29` |
| author | `Dean` |
| category | `tech-note` |
| tags | `[github, vite, static-site]`（已填；非空） |
| description | 已填 |
| searchDescription | 已填 |
| cover | `""`（空） |
| coverAlt | 已填 |
| status | `draft` |
| draft | `true` |
| canonical | `auto` |
| publishTargets.github.enabled | `true`（mode `full`） |
| publishTargets.blogger.enabled | `false`（mode `summary`；非 blogger 候選） |
| blocks | toc=false / adsenseTop=true / adsenseMiddle=false / adsenseBottom=true / hashtags=true / socialFollow=true / relatedPosts=true / sidebar=true |
| 內文長度 | 約 39 段落型行；含前言 / 測試目標 / 實測流程 / 觀察結果 / 結論 |

**與 `docs/20260703-post-c1-next-deploy-candidates.md` §2.1 之差異**：
該盤點指出 `tags:` 目前為空。實測目前 frontmatter `tags` 已填三個 tag id（`github` / `vite` / `static-site`），與 `portable-blog-system-mvp` / `what-is-design-token` 同組。**「補 tags」已不再是 blocker**；其他項目仍成立。

---

## 4. Current candidate status

- 目前為 **medium risk candidate**（per `docs/20260703-post-c1-next-deploy-candidates.md` §2.1、§3）。
- **不在** 已 live 的 first GitHub Pages deploy（`1170e7e`）scope 內（scope 為 3 篇 github-native + 1 blogger-cross mirror，均為 `status ∈ {ready, published}`）。
- **不在** C1 刻意 quarantine 名單（`github-pages-blog-planning` 才是）。
- 因 `status: draft` + `draft: true`，build 階段一律排除；即使今天 build/deploy 也不會出現在 live 站上。
- 內容線是 Admin UI 實測記錄；屬「工具/流程」向文章而非「產品內容」向文章，是否對外屬於 **Dean 之編輯決策**。

---

## 5. Public-readiness questions for Dean

以下為需 Dean 決定的公開性 / 內容性問題（**Claude 不預先決定、不代為選擇**）：

1. **這篇「Admin UI 實測紀錄」是否適合對外公開？**
   - 內容公開 Admin dev-mode-only 內部流程（Admin 頁 / New post draft / 按鈕狀態邏輯 / target path 命名規則）。
   - 是否符合 Dean 對本站對外定位？（GitHub Pages 站定位 = 技術筆記主站 + 心得經營筆記主站；per CLAUDE.md §2.2）
2. **是否要 flip `status: draft` → `ready`（或 `published`）？**
   - flip 屬 content edit，須另開 phase + explicit approval，不由本盤點推動。
   - flip 後仍會經 §4 pre-publish gate（prepublish check + build + online 驗收）。
3. **是否要補 `cover:` 封面圖？**
   - 目前為空字串；非硬性 validator 阻擋，但建議補（一致於其他 tech-note）。
   - 若補，需選定圖源（Google Drive / Blogger media / public/images）+ 補 `coverAlt`（已填，可保留）。
4. **`date: 2026-06-29` 是否要更新？**
   - 若之後 flip 為 ready 並公開，`date` 為文章發佈日；`updated` 亦為同日。
   - Dean 可選：保留原日期（記錄實測當日）/ 更新為公開當日 / 兩者分離。
5. **描述 Admin dev-mode 是否有洩漏風險？**
   - 內文 §實測流程 提到「本機開發環境」/「Admin 頁面」/「New post draft 區塊」/「target path」/「filename 規則」。
   - 依 CLAUDE.md §3a red lines，`ads.config.json` 之 AdSense id、GA4 measurement id、affiliate token 均不得出現在 docs / 文章；**本文 body 已檢查無此類洩漏**。但 Dean 應決定是否要進一步遮蔽 Admin route / dev port / 內部路徑細節。
6. **是否要補 Blogger cross-mirror？**
   - 目前 `publishTargets.blogger.enabled: false`；文章為 GitHub-only 定位。
   - 若要跨鏡到 Blogger，須另開 phase + Dean explicit approval + content edit + Blogger 手動貼上驗收流程。

---

## 6. Blockers / unknowns

Blocker（尚未解除即不可 deploy）：

- 🔴 **status flip 未授權**：目前 `status: draft` + `draft: true`；build 一律排除；deploy 亦不會納入。除非 Dean explicit approve flip 為 ready/published，否則本篇無法進入下一波 GitHub Pages deploy 候選。
- 🔴 **對外公開性未確認**：per §5 Q1，Dean 須決定本篇是否適合對外；未確認前，即使 flip 也不應推動。

Unknown（Dean 決定即可解除）：

- 🟡 是否補 `cover:`（非硬性）。
- 🟡 是否更新 `date` / `updated`。
- 🟡 是否補 Blogger cross-mirror（另條決策線）。

**已解除 / 非 blocker**（相對 `docs/20260703-post-c1-next-deploy-candidates.md` §2.1 之舊描述）：

- ✅ `tags:` **已填**（`[github, vite, static-site]`）；不再是 blocker。

**不屬本篇 blocker、但需獨立追蹤的線**：

- Reverse UTM pm-26 deploy = BLOCKED（與本篇無關）。
- Admin write path（Apply / middleware / admin-write-cli）= dormant（與本篇無關；本篇本身即為 Admin export MVP 的實測紀錄）。
- FB sidecar 真實寫入 = dormant（與本篇無關）。

---

## 7. What this slice intentionally does not change

本 slice 唯一 mutation = 新增本檔 `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（透過單一 additive commit 記錄）。

明確 **未變更 / 未執行** 之清單：

- ❌ 未修改 `content/github/posts/2026-06-29-admin-ui-draft-generator-first-test.md`（frontmatter 或內文）
- ❌ 未 flip `status`（仍 `draft`）
- ❌ 未修改 `draft` 欄位（仍 `true`）
- ❌ 未修改 `publishTargets`（github enabled=true / blogger enabled=false 皆維持）
- ❌ 未修改 `tags` / `cover` / `date` / `updated`
- ❌ 未動任何其他 `content/**` / `content/settings/**`
- ❌ 未動 `src/**` / `views/**` / `public/**`
- ❌ 未動 `package.json` / `package-lock.json`
- ❌ 未動 `CLAUDE.md`（保持在 38328 chars / 49967 bytes，遵守 40000 chars 管控線）
- ❌ 未動 `MEMORY.md` / `memory/`
- ❌ 未執行 `npm run dev` / `preview`
- ❌ 未執行 `npm run build*` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`
- ❌ 未執行 `npm run validate:content` 或任何 check guard（carry-forward CLAUDE.md §3a Validation baseline）
- ❌ 未觸碰 `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/`
- ❌ 未觸碰 deploy clone `/d/github/blog-new/portable-blog-deploy`（仍 `1170e7e` / clean / 0/0）
- ❌ 未 push gh-pages / 未 deploy
- ❌ 未動 Blogger 後台 / GA4 / AdSense / Search Console / Google Drive
- ❌ 未 `npm install` / 未動 dependency
- ❌ 未新增 devDependency（無 Playwright / 無測試框架變更）

---

## 8. Recommended next Dean-gated choices

以下皆需 **Dean explicit approval + 另開 phase**；Claude 不主動推動任一項。

### 8.1 若 Dean 決定「本篇對外」（最小推進路徑）

建議順序（每一步都是獨立 Dean-gated phase）：

1. **Content flip phase**（content edit）：
   - `status: "draft"` → `"ready"`（或 `"published"`）
   - `draft: true` → `false`
   - （選）補 `cover:` + 保留 `coverAlt`
   - （選）更新 `date` / `updated`
2. **Prepublish check phase**（read-only）：
   - `npm run check:github-pages-prepublish`（期望 16/16 PASS）
   - `npm run check:github-pages-prepublish-smoke`（期望 8/8 PASS）
   - `npm run validate:content`（期望 0 error / warning 分佈與 baseline 一致）
3. **Build-only phase**（write to `dist/`；不 deploy）：
   - `npm run build:github`（其他 build 視需求）
   - 確認本篇進 `dist/`，slug 與 canonical 正確
4. **Preview-only phase**（read-only）：
   - `npm run preview`；Dean 目視驗收
5. **Deploy phase**（進入 deploy clone；push gh-pages）：
   - 逐篇 gate；per `docs/github-deploy.md` F-01 runbook
6. **Online 驗收 phase**：
   - Dean 確認 live URL；回填任何後續 metadata

### 8.2 若 Dean 決定「本篇不對外」

- 維持 idle freeze；本篇留在 `content/github/posts/` 作為內部實測紀錄。
- 不需執行任何動作。

### 8.3 若 Dean 尚未決定

- **最保守路徑 = 維持 idle freeze**（推薦）。
- 本篇既不阻擋既有 live scope，也不需要立即處理。

### 8.4 平行的其他決策線（與本篇無關；per `docs/20260703-post-k5-next-line-readiness-inventory.md`）

- C1-C: read-only build readiness audit（獨立 docs-only phase）
- K.1 / K.3 / K.4: 各自獨立 phase
- Reverse UTM pm-26: dormant / BLOCKED
- Admin write path: dormant

---

## 9. Final status

**Decision note only.** 本篇 readiness / blockers / questions 已集中登錄；接下來的推進 = Dean-side + manual + explicit approval。Claude 不代為 flip、不代為 build、不代為 deploy。

本檔於下一個 Dean-gated phase 啟動前，**不需要再更新**；若 Dean 決定推進，新的 phase 會產出自己的 doc（如 content flip ledger / prepublish check result / deploy ledger）。

---

## 10. Cross-links

- `content/github/posts/2026-06-29-admin-ui-draft-generator-first-test.md`（本檔評估對象）
- `docs/20260703-post-c1-next-deploy-candidates.md` §2.1 / §3（medium candidate 分類來源；註：其中「`tags:` 目前為空」已被本檔 §3 校正為已填）
- `docs/20260704-c1-c1-verify-only-result.md`（frozen verify-only baseline；本檔 §2 承接）
- `docs/20260703-post-k5-next-line-readiness-inventory.md`（平行候選線 map）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（若 Dean 決定推進，§4 pre-publish gate 為權威）
- `docs/github-deploy.md`（F-01 deploy runbook）
- `docs/publish-workflow.md` §3–§4（build order authority）
- `CLAUDE.md` §3a Validation baseline / Core operating rules / Red lines / Recommended next paths

---

（本文件結束 / end of document）
