# Reverse UTM L1 Smoke — Completion Report

Phase: `20260525-night-4-reverse-utm-l1-smoke-completion-report-a`
Date: 2026-05-25
Scope: docs-only

---

## A. Phase 摘要

本 phase 是 **reverse UTM L1 source-grade smoke completion report**。

目的：

- 封存 **fixture-free smoke 驗證能力**，把目前已完成的 plan + harness + npm script 三件套定位為「可重複跑的 L1 cold-start / regression check」。
- 本報告**不**代表 reverse UTM production fixture / Blogger repost / GA4 Realtime 驗收已完成。
- 本報告**不**啟動 L2 fixture，也**不**動 build、deploy、push、Blogger。

reverse UTM live 狀態仍維持 dormant，與 `CLAUDE.md` §16.4「Blogger → GitHub Pages（source landed；un-deployed；live but dormant）」段落一致。

---

## B. Baseline（封存時刻）

- HEAD = origin/main = `0d6ac84`
- branch: `main`
- ahead / behind = 0 / 0
- working tree clean（`git status --short --branch` 僅顯示 `## main...origin/main`）
- `npm run smoke:reverse-utm` → `reverse UTM L1 smoke passed`，exit 0

---

## C. Commit chain

本 L1 鏈共三個 commit（依時序）：

| Commit | Type | Summary |
| --- | --- | --- |
| `6b85ecf` | docs(plan) | add reverse UTM L1 code-smoke design plan |
| `81bf950` | feat(smoke) | add reverse UTM L1 fixture-free smoke harness |
| `0d6ac84` | chore(smoke) | add npm script for reverse UTM L1 smoke harness |

對應檔案：

- `docs/20260525-reverse-utm-code-smoke-plan.md`（plan）
- `src/scripts/smoke-reverse-utm.js`（harness）
- `package.json`（npm script `smoke:reverse-utm`）

本報告封存後，以上三個 commit 不需要再追加修改。

---

## D. 已完成範圍

- ✅ docs plan 已建立（`docs/20260525-reverse-utm-code-smoke-plan.md`）。
- ✅ smoke harness 已建立（`src/scripts/smoke-reverse-utm.js`）。
- ✅ `package.json` 已加入 `smoke:reverse-utm` script。
- ✅ 可用 `npm run smoke:reverse-utm` 執行；exit 0 = 全 pass。
- ✅ 使用 Node built-in `node:assert`（`strict` mode）。
- ✅ 無新增 dependency（dependencies / devDependencies 未變動）。
- ✅ 無 test framework（不引入 vitest / jest / mocha 等）。
- ✅ 無 content fixture（不依賴 ready / published 文章）。
- ✅ 無 I/O（不讀 `content/`、不讀 `content/settings/`、不寫 `dist/` / `dist-blogger/`）。
- ✅ 不跑 build（與 `npm run build` / `npm run build:blogger` 完全分離）。
- ✅ 不寫 dist（harness 純 in-memory）。
- ✅ harness import 自 `src/scripts/ga4-url-builder.js` 的 named exports，不修改 source。

---

## E. L1 smoke 覆蓋摘要

harness（`src/scripts/smoke-reverse-utm.js`）目前覆蓋以下方向，分節對應 plan §3：

### E.1 `isGithubCrossLink` — GitHub cross-link 判斷（§3.1）

- GitHub host → `true`
- 第三方 host → `false`
- Blogger host（非 GitHub）→ `false`（與 forward direction 隔離）
- 非 string / `''` / `null` / `undefined` / number / object 輸入 → `false` 且不 throw
- `settings.site.githubSiteUrl` 缺失 → `false`
- `settings = {}` / `null` / `undefined` → `false` 且不 throw

### E.2 `applyCrossSiteUtm({ direction: 'to_github' })` — reverse UTM 注入（§3.2）

- GitHub cross-link + `slot=related_links` → 注入 `utm_source=blogger` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links`；`target=_blank`；`rel` 含 `nofollow noopener noreferrer`
- `slot=other_links` → `utm_content=other_links`
- 非 GitHub host + `direction='to_github'` → `applied=false`；`url` / `target` / `rel` 全部 untouched
- **Strategy A**（既有 UTM 保留）：
  - 既有 `utm_source=other` → 不覆蓋，但 `target` / `rel` 仍套
  - 既有 `utm_medium=email` only → 不注入 `utm_source`
- `direction` 省略 → default `'to_blogger'`（backward compat）：
  - GitHub URL + default → `applied=false`（檢查 bloggerHost）
  - Blogger URL + default → `applied=true` + `utm_source=github_pages`（forward UTM）

### E.3 `utm_source` / `utm_medium` / `utm_campaign` / `utm_content` guard（§3.4）

- reverse UTM 注入結果 **不得** 使用 legacy forward-UTM 的值：
  - `utm_medium !== 'internal_referral'`
  - `utm_campaign !== 'blogger_to_github'`
  - `utm_content !== 'internal_referral'`

### E.4 `mergeRel` 行為（§3.5）

- 純函式：plain merge / 既有 token 保留於 head / 重複 token 去重 / 空輸入 → 空輸出
- `null` / `undefined` primary 不 throw
- 經由 `applyCrossSiteUtm` 進入時，`existingRel='sponsored'` 仍被保留且 `nofollow` / `noopener` / `noreferrer` 正確合入

### E.5 非 GitHub link skip — CORE INVARIANT（§3.6）

reverse UTM 必須僅作用於 GitHub cross-link，**不得**污染其他連結：

- Blogger 同站連結 + `direction='to_github'` → 不注入 reverse UTM
- 第三方 external 連結 → `url` unchanged，無 `utm_source=blogger`
- affiliate 連結（`existingRel='sponsored'`）→ `url` unchanged，rel 不被改動

---

## F. 明確未完成 / 不代表完成的事項

本報告 **不** 代表以下任何項目完成：

- ❌ 尚未建立 L2 content fixture（ready Blogger post 含 GitHub cross-link 的 `.md` + `.publish.json`）。
- ❌ 尚未讓 ready Blogger post 真的產生 GitHub cross-link（目前 `dist-blogger/` 既有 3 ready posts 無 GitHub cross-link）。
- ❌ 尚未 build `dist-blogger/` 驗證實際 `post.html` 是否注入 reverse UTM。
- ❌ 尚未 deploy gh-pages。
- ❌ 尚未重貼 Blogger 後台。
- ❌ 尚未做 GA4 Realtime 驗收。
- ❌ reverse UTM live production 仍 **dormant**，待後續 pm-26 / fixture 階段啟動。

本批僅證明：**source-level pure function 行為符合 plan §3.1–§3.6 預期**。
未證明：production data path（content → build → dist-blogger HTML → Blogger live → GA4 Realtime）端到端正確。

---

## G. 後續建議

依「安全順序」列出，**本批不執行**：

1. **維持 L1 smoke 作為 future cold-start / regression check**
   每次 cold-start session 或要動 `src/scripts/ga4-url-builder.js` / `src/scripts/build-blogger.js` 前，先 `npm run smoke:reverse-utm` 確認 baseline；exit 非 0 立即停下。

2. **規劃 L2 fixture-based smoke，另開 phase**
   L2 需建立 minimal ready Blogger post fixture（含至少一個 `relatedLinks` GitHub cross-link），跑 `build-blogger` 後 grep `dist-blogger/posts/*/post.html` 驗證 `utm_source=blogger`。L2 會動 `content/` 與 `dist-blogger/`，與本 L1 docs-only 邊界不同，必須另開 phase。

3. **若要掛入 build / prepush / CI，另開 phase 評估**
   目前 `package.json` 僅以 `smoke:reverse-utm` 提供手動執行；是否串入 `prebuild` / `prepush` / GitHub Actions 屬獨立決策，需考量執行時間、失敗策略、與 `predev` / `prebuild` chain 互動，**不**在本批處理。

4. **若要啟動 production validation，按以下順序**
   a. L2 fixture 建立並通過。
   b. `npm run build:blogger` 驗證 `dist-blogger/` 注入正確 reverse UTM。
   c. user 手動把目標 ready post 重貼 Blogger 後台。
   d. user 在 GA4 Realtime 觀察 `utm_source=blogger` event 流入。
   e. 全程通過後始能把 reverse UTM 從 dormant 轉為 production live，並更新 `CLAUDE.md` §16.4 對應段落。

---

## H. 邊界宣告

本 phase 嚴格 docs-only：

- 僅新增 1 個檔案：`docs/20260525-reverse-utm-l1-smoke-completion-report.md`
- 不改 `src/`
- 不改 `content/`
- 不改任何 `.publish.json`
- 不改 `package.json`
- 不改 `.claude/`
- 不跑 build
- 不 deploy
- 不 push
- 不 reset / rebase / force push
- 不啟動 L2 fixture
- 不重貼 Blogger
- 不做 GA4 Realtime 驗收
