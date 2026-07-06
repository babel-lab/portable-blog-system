# GitHub Pages Publish-Path Readiness & Pre-Publish Checklist（docs-only）

**Phase**：`20260702-c1-github-pages-publish-path-readiness-and-prepublish-checklist-docs-only`
**Date**：2026-07-02（新 Claude session，接續 Phase 1 Manual E2E PASS）
**Type**：docs-only / read-only 整理。**不** build、**不** deploy、**不**碰 gh-pages、**不**碰 deploy clone、**不**進 Phase 2、**不**建立真實文章、**不**改 content / settings / src / CLAUDE.md。

---

## 1. Purpose / Scope

把「一篇 GitHub post 從 repo（`content/github/posts/*.md`）走到 GitHub Pages LIVE」的**發布前路徑**整理成單一 readiness + checklist 文件，作為未來實際發布時的操作對照。

**本文件明確不是**：

- 不是正式 publish（不改任何文章 `status`）
- 不是 deploy（不跑 build、不 push gh-pages）
- 不是 Phase 2
- 不是既有 runbook 的取代 —— 本文件為「當前狀態下的收斂入口 + pre-publish gate」，把散落的既有文件串成一條線。

**權威來源文件（本文件只引用、不重寫其細節）**：

| 文件 | 角色 |
|---|---|
| `docs/github-deploy.md`（F-01） | GitHub Pages 部署 runbook（方案 C = 同 repo + gh-pages 手動 copy；build / dist 產物表 / gh-pages 步驟 / 上線後驗證） |
| `docs/publish-workflow.md` §3–§4 | 整體 build 順序（validate → build → build:sitemap） |
| `docs/checklists/github-deploy-checklist.md` | 操作型勾選清單（上線後 functional / assets / mobile / console） |
| `docs/20260701-github-draft-publish-readiness-checklist.md` | 單篇 draft → ready/published 的 metadata / SEO / 內容 gate |
| `docs/20260701-github-draft-metadata-smoke.md` | frontmatter contract smoke（11 條斷言，direct-node） |
| `docs/20260702-phase1-manual-e2e-runbook.md` | Phase 1 手動 E2E（Admin draft export → 手動落地 → 手動轉 ready）已 PASS 紀錄 |

⚠️ **Deploy clone 邊界**：`/d/github/blog-new/portable-blog-deploy`（gh-pages）本輪**未讀取、未進入、未觸碰**；其當前 branch / commit / 乾淨度在本文件視為 **UNKNOWN，不猜測**（見 §7）。

---

## 2. Current known baseline（2026-07-02）

| 項目 | 值 |
|---|---|
| source repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD == origin/main | `5a85d7d`（`docs(state): record Dean manual Phase 1 E2E PASS`） |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |
| Phase 1 Manual E2E Happy Path | ✅ PASS（Dean 手動，2026-07-02 15:47–16:12） |
| `validate:content` baseline（draft 階段） | `0 error / 135 warning / 107 post` |
| `validate:content`（ready 測試曾達） | `0 error / 137 warning / 108 post`（測試文章轉 ready 時；已刪回 baseline） |
| 測試檔 `content/github/posts/2026-07-02-phase1-e2e-manual-test-1547.md` | 已刪除 / 未 commit / 不存在 |

`content/github/posts/` 現況（非 fixture，read-only 盤點）：

| status | 篇數 | 檔案 |
|---|---|---|
| `published` | 1 | `2026-07-01-github-pages-build-preview-workflow.md` |
| `ready` | 3 | `20260504-github-pages-blog-planning.md` / `20260504-portable-blog-system-mvp.md` / `2026-06-30-what-is-design-token.md` |
| `draft` | 1 | `2026-06-29-admin-ui-draft-generator-first-test.md` |

（另有 `20260504-github-pages-blog-planning.fb.md` = FB sidecar，非文章本體。）

> production expected warning = 1（`page-noindex-in-listings` @ `20260504-portable-blog-system-mvp.md`，intentional hold，非 blocker）；其餘 warnings 全來自 `content/validation-fixtures/`。

---

## 3. Status contract（發布狀態合約）

| status | 意義 | 是否被 validator 正式檢查 | 是否為 build/publish 候選 |
|---|---|---|---|
| `draft`（`draft: true`） | 草稿 | 被過濾，不進正式輸出 | ❌ 否 |
| `ready`（`draft: false`） | 定稿、可正式檢查 | ✅ 是（gate 較嚴） | ✅ 是 |
| `published`（`draft: false`） | 已發布 | ✅ 是 | ✅（已上線內容） |
| `archived` | 封存 | —— | 依設定不進列表 |

**契約鐵則**：

- **Admin UI（`/admin/#new-post-draft`）永遠只輸出 `status: "draft"` + `draft: true`**；無 ready option、無 repo write path。
- `draft → ready → published` 的 flip **只能由 Dean 手動編輯 frontmatter**，Claude 不自動 flip。
- flip 後 validator gate 較嚴，warning 數可能上升（如 baseline 135 → ready 137）；**只要 error 維持 0 即通過**。

---

## 4. Pre-publish checklist（單篇文章：draft/ready → 準備發布）

> 逐篇對照；勾選項為人工 checklist，非自動化。細部 metadata gate 見 `docs/20260701-github-draft-publish-readiness-checklist.md`。

**4.1 Frontmatter contract**

- [ ] `site` / `primaryPlatform` = `github`
- [ ] `contentKind` 為合法列舉（`post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page`）
- [ ] `title` / `titleEn` / `slug` 皆非空；slug 無與現有文章碰撞
- [ ] `date` / `updated` 合理
- [ ] `publishTargets.github.enabled === true`；`publishTargets.blogger.enabled` 維持 `false`（除非另開 Blogger slice）

**4.2 Category / Tags registry**

- [ ] `category` 存在於 `content/settings/categories.json`，且該 entry `site[]` 含 `github`
- [ ] `tags` 全存在於 `content/settings/tags.json`，且各 entry `site[]` 含 `github`；無紅線禁用 tag

**4.3 Cover / SEO 欄位**

- [ ] `description` 已填、非佔位；長度未過長（`long-description` soft warning 為參考）
- [ ] `searchDescription` 已填（空不擋 ready，建議補）
- [ ] `cover` / `coverAlt` 一致性：有 `cover` → `coverAlt` 需有意義描述；`cover` 空 → 建議 `coverAlt` 一併清空

**4.4 內容完整性**

- [ ] body 為正式正文，非 Admin export 預設 scaffold
- [ ] body 內無第二個 `# ` 一級標題（frontmatter `title` 已是頁面 H1）

**4.5 全站回歸（發布前 baseline 未回退）**

- [ ] `npm run validate:content` → **0 error**（未新增 error 即通過；warning 上升可接受）
- [ ] 無測試檔 / 暫存 `.md` 殘留於 `content/github/posts/`
- [ ] `git status --short` clean（除本次刻意的 frontmatter flip 外無雜項）

**4.6 發布決策 gate（Dean 手動）**

- [ ] Dean 已確認這篇要 `ready` / `published`
- [ ] Dean 已明確授權「是否真的進 build」
- [ ] Dean 已明確授權「是否真的進 deploy（push gh-pages）」

---

## 5. Command checklist（future step only — 本輪一律不執行）

> ⚠️ 以下所有指令皆為**未來實際發布時**的建議順序，**本輪全部不執行**。列出僅供對照。權威流程見 `docs/github-deploy.md` §4–§5 與 `docs/publish-workflow.md` §3。

**5.1 發布前驗證（未來；read-mostly，validate 不寫檔）**

```bash
# 【本輪不執行】single-draft frontmatter contract smoke
node src/scripts/check-github-draft-metadata.js      # 預期 11 / 0（斷言綁特定 draft，flip 後需同步調整）

# 【本輪不執行】全站驗證 —— 只要有 error 就停止
npm run validate:content                              # 必須 0 error
```

**5.2 build（未來；會寫 `dist/`）**

```bash
# 【本輪不執行】
npm run build                # vite build + prebuild(build-github) + postbuild(build:sitemap)
npm run build:sitemap        # ⚠️ 若單獨跑，必須在 build 之後（vite emptyOutDir 會清 dist）
npm run preview              # 本機檢查 dist（不啟長駐 dev server；檢查後關閉）
```

`dist/` 產物齊全性對照見 `docs/github-deploy.md` §4 表。

**5.3 deploy（未來；會碰 gh-pages / deploy clone）**

```bash
# 【本輪不執行 + 須 Dean explicit approval + deploy clone 狀態需先確認】
# 詳細步驟見 docs/github-deploy.md §5.4（增量更新）：
#   cd ../portable-blog-deploy → rm -rf ./* → cp -r ../portable-blog-system/dist/* . → touch .nojekyll
#   → git add . → git commit -m "deploy: <hash> snapshot" → git push origin gh-pages
```

**5.4 上線後驗證（未來）**

- 見 `docs/github-deploy.md` §7 + `docs/checklists/github-deploy-checklist.md`（functional / assets / mobile / console / SEO）。

---

## 6. Responsibility split（權責分工）

| 動作 | 負責 |
|---|---|
| 決定哪篇文章 `ready` / `published` | **Dean 手動**（改 frontmatter） |
| 是否允許 build | **Dean 明確授權** |
| 是否允許 deploy（push gh-pages） | **Dean 明確授權** |
| 碰 gh-pages / deploy clone | **Dean**（或經 Dean 授權後 Claude 依 runbook 執行） |
| Blogger / Google / GA4 / AdSense / Search Console 後台 | **Dean 手動**（Claude 永不登入） |
| checklist / readiness 整理 / diff review / docs-only 記錄 | **Claude** |
| frontmatter contract smoke / validate 讀取（經授權時） | **Claude**（read/validate 層；不 flip status） |

---

## 7. Stop conditions（遇到即停止，不猜測）

- 🛑 `validate:content` 出現任何 **error** → 停止，回報，不發布。
- 🛑 working tree **不乾淨**（非預期的 dirty / 有殘留測試檔） → 停止，回報。
- 🛑 Dean **未明確說 build** → 不 build。
- 🛑 Dean **未明確說 deploy** → 不 deploy。
- 🛑 **deploy clone 狀態未知** → 停止，不進入、不讀取、不猜測其 branch / commit / 乾淨度；需 Dean 指示後才處理。
- 🛑 出現 `.git/index.lock` / baseline 不符 → 停止回報，不自行修正。

---

## 8. Next-step options（本輪不選、不啟動）

- **A.** 只完成本 checklist 並 commit 此 docs（docs-only；可選 CLAUDE.md 極小 state sync，另議）。
- **B.** 之後由 Dean 指定**一篇真實文章**進入 ready candidate → 走 §4 pre-publish checklist（單篇）。
- **C.** 之後**另開 session** 做 read-only build readiness（檢查 build script / dist 產物路徑對照，仍不實際 deploy）。

→ 三者互斥於「是否觸發 build/deploy」；A 為最保守，B 推進單篇完成度，C 為 build-path 前置稽核。**本輪僅產出本文件，等 Dean 確認 diff。**

---

## 9. 本 phase 邊界（self-check）

- 唯一 file change：新增本檔 `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`
- 未改 `src/` / `content/` / `content/settings/` / `CLAUDE.md` / `MEMORY.md` / `memory/`
- 未碰 deploy clone / gh-pages / dist
- 未跑 build / deploy / regression smoke；未啟動 dev server
- 未改 Blogger / Google / GA4 / AdSense / Search Console
- 未引入 Playwright / 新 devDependency；未進 Phase 2

---

## 10. Automated verification pointer

Before any future GitHub Pages publish/deploy slice, run the read-only guard pair:

```bash
npm run check:github-pages-prepublish
npm run check:github-pages-prepublish-smoke
```

Expected baseline:

- `check:github-pages-prepublish` → `16/16 PASS`
- `check:github-pages-prepublish-smoke` → `8/8 PASS`

These checks are read-only. They do not build, deploy, publish, fetch, or pull. They only verify source/deploy repo baseline invariants (branch / HEAD / clean / ahead·behind / `.git/index.lock` absence / required docs present) and self-test the guard itself against seven failure fixtures.

---

## 11. contentType guard 現況與決策（docs-only decision note，2026-07-06）

**本節為 docs-only decision note，不是本次實作 aggregate registration**。以下記錄 `check:content-type-metadata` 與 `check:github-pages-prepublish` aggregate 的當前關係，供未來評估切片對照。

### 11.1 現況

- `check:content-type-metadata` 已是**獨立 npm script**（`node src/scripts/check-content-type-metadata.js`），report-only / warning-only / 一律 exit 0；掃 `content/{github,blogger}/{posts,pages}/**/*.md`（排除 `*.fb.md` sidecar）。
- 本 session（2026-07-06）production scan 實測結果：**scanned 17 / legacy(no `contentType`) 17 / valid 0 / warnings 0，exit 0**。
- `check:npm-script-targets` live baseline 已包含 `check:content-type-metadata`，本 session 實測 **39/39 PASS**（涵蓋所有 `node src/scripts/*.js` 目標存在性）。

### 11.2 決策

**暫時不把 `check:content-type-metadata` 併入 `check:github-pages-prepublish` aggregate**。

理由：

- `check:github-pages-prepublish` live baseline 目前為 **16/16 PASS**（8 條 source-repo + 2 條 required-doc + 6 條 deploy-clone），語意為 git-state + 必要 doc 存在性守門。
- `check:github-pages-prepublish-smoke` Case 1（happy-path）以 **hard-coded 字串比對** `total=16  pass=16  fail=0` 鎖 exit-code / output-contract；任何往 aggregate 加項都會直接讓 smoke Case 1 FAIL，除非同步 patch smoke 期望值。
- 併入 aggregate 會**同時牽動 prepublish baseline 與 smoke baseline**，屬 code + smoke 雙位移；當前 production content 尚無 `contentType` 使用，實益 = 0。
- 在正式內容尚未導入 `contentType` 前，獨立 npm script + `check:npm-script-targets` 存在性覆蓋已足夠。
- `check:content-type-metadata` 為 report-only（exit 0），與 prepublish 的 fail-fast（任一 FAIL → exit 1）語意不同；併入會 dilute prepublish 的 fail-fast contract 或靜默吃掉 contentType warning，兩者皆非期望。

### 11.3 未來切片觸發條件

以下任一情況發生時，另開切片重新評估是否納入 aggregate：

- 正式 production content 開始新增 `contentType` frontmatter（valid > 0 或 warning > 0），且需要在 pre-publish 時強制擋下不合法值。
- 引入 campaign page / landing page 內容線，`contentType` 成為 build / render / SEO 決策依據。
- `check:content-type-metadata` 語意由 report-only 升級為 fail-fast（例：對特定值域強制 gate）。

未來若納入 aggregate，同一切片須：
- refactor `check-content-type-metadata.js` 對外暴露 result records（現行為 `main() → exit 0`）
- 同步 patch `check-github-pages-prepublish-readiness-smoke.js` Case 1 的 `total=16  pass=16  fail=0` 期望值
- 於 CLAUDE.md §Validation baseline 同步 baseline 位移

**本輪不做以上任何一項**。

---

（本文件結束）
