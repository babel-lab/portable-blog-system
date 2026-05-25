# Reverse UTM pm-26 Pre-Flight Readiness Checklist

Phase: `20260525-night-6-reverse-utm-pm26-preflight-readiness-doc-a`
Date: 2026-05-25
Scope: docs-only

---

## §A. 文件目的

本文件是 **pm-26 pre-flight readiness checklist**。

明確聲明：

- ❌ **本文件不代表 pm-26 已啟動**。
- ❌ **本文件不代表 deploy / Blogger repost / GA4 Realtime 驗收已完成**。
- ❌ **本文件不變更任何 production state**；不 build、不 deploy、不 push、不重貼 Blogger、不操作 GA4。

本文件之目的：

- ✅ 在 reverse UTM 自 pm-24a/b/c source landing → L1 smoke completion → pm-25 pre-deploy verify 之累積基礎上，**提前**整理「未來真正啟動 pm-26 deploy verify 之前」需要 user 確認哪些條件、需要哪些手動步驟、按哪個順序驗收。
- ✅ 將 `docs/reverse-utm-fixture-plan.md` §6 啟動條件 + §10.5 Phase 1-6 順序之精華，凝練為 user-actionable checklist。
- ✅ 把當前 reverse UTM **無法**自然進入 pm-26 之 **root cause**（無 positive GitHub cross-link fixture）寫白；避免未來 cold-start session 誤判 dormant = bug。

本文件**不**取代以下既有文件；僅為其 pre-flight entry index：

- `CLAUDE.md` §16.4（reverse UTM 規格主錨）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12 + §0 status update）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 addendum）
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（pm-25 verify 結果）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（L1 smoke 完成）
- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台重貼 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM 觀察 SOP）

---

## §B. 目前狀態（2026-05-25 night-6 起點）

| 維度 | 值 |
|---|---|
| `git rev-parse HEAD` | `eb42e002016af0680f662ec4d9cae6ff3a326cb1`（short `eb42e00`）|
| `git rev-parse origin/main` | `eb42e002016af0680f662ec4d9cae6ff3a326cb1` |
| HEAD ≡ origin/main | ✅ 是 |
| `git status --short --branch` | `## main...origin/main`（working tree clean）|
| ahead / behind vs origin/main | `0 / 0` |
| `npm run smoke:reverse-utm` | ✅ `reverse UTM L1 smoke passed`，exit 0 |
| reverse UTM source 已 landed | ✅ pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`（2026-05-23）|
| L1 smoke completed | ✅ docs+harness+npm script 三件套 commits `6b85ecf` / `81bf950` / `0d6ac84`（2026-05-25 night-4）|
| pm-25 pre-deploy verify completed | ✅ docs report commit `e4feb33`（2026-05-25 night-5）|
| **live 狀態** | 🟡 **landed but dormant** |

→ baseline 完全對齊 pm-25 收尾後之預期 freeze 狀態；本文件之落地不改變此狀態。

---

## §C. pm-26 不可啟動的原因

當前 reverse UTM **不能進入** pm-26（Blogger 後台重貼 + GA4 Realtime 驗收），原因如下：

### C.1 根本原因：positive fixture 缺席

- ❌ **目前沒有 positive GitHub cross-link fixture**。
- ❌ 唯一 ready full-mode Blogger post（`content/blogger/posts/20260515-we-media-myself2.md`）之 `relatedLinks` **不含** GitHub Pages cross-link；`otherLinks` 為 `[]`。
- ❌ 整個 `content/blogger/` 目錄 grep 不到任何 `babel-lab.github.io` 引用。

per `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md` §D 之 ready posts inventory：

| Slug | status | bloggerMode | 含 GitHub cross-link？ |
|---|---|---|---|
| `we-media-myself2` | ready | full | ❌ 否 |
| `github-pages-blog-planning` | ready | **summary**（非 full）| n/a（reverse UTM 只在 full 模式觸發） |
| `portable-blog-system-mvp` | ready | **summary**（非 full）| n/a |
| `sample-book-review` | **draft**（不 export）| full | n/a |
| `20260525-draft-book-review` | **draft**（不 export）| full | n/a |

### C.2 因此就算現在 deploy / 重貼 Blogger，**也驗不到 reverse UTM 正向注入**

- `npm run build:blogger` 後 `dist-blogger/posts/we-media-myself2/post.html` 不含任何 `utm_source=blogger` reverse UTM 注入（per pm-25 verify §F.4：0 命中於該 post.html）。
- 即使把 `we-media-myself2` 重貼 Blogger 後台，**Blogger 端點該 post 內任一連結都不會帶 reverse UTM 跳 GitHub Pages**（沒有 GitHub cross-link 可點）。
- → GA4 Realtime 也**不會**看到 `utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` 之命中。

### C.3 目前累積之驗證範圍

per pm-25 verify §G：

- ✅ **negative invariant verified**：無 GitHub cross-link 之 ready full-mode post 不誤注入 reverse UTM；非 GitHub external links 不誤注入；legacy summary CTA scheme 與 reverse UTM 可區分；GitHub→Blogger forward UTM 不受影響。
- ✅ **L1 source-level pure function verified**：`isGithubCrossLink` / `applyCrossSiteUtm({ direction: 'to_github' })` / `mergeRel` 行為符合 plan §3.1-3.6 預期（per L1 smoke harness）。
- ⚠️ **positive invariant unverified**：reverse UTM 在「有 GitHub cross-link」之路徑下是否正確注入 → **僅 L1 in-memory smoke 通過；無 production-grade fixture 驗證 build → dist → Blogger → GA4 端到端**。

→ 目前只完成 **negative invariant + dormant verification + L1 source smoke**；未證明 production data path 正向通暢。

---

## §D. pm-26 啟動條件（必要清單）

未來啟動 pm-26 deploy verify 前，以下**全部**必須成立。對齊 `docs/reverse-utm-fixture-plan.md` §6 + `docs/blogger-to-github-reverse-utm-plan.md` §10 step 7：

### D.1 內容前置

| # | 條件 | 對應驗證方法 |
|---|---|---|
| 1 | **存在至少 1 篇 ready Blogger full-mode post** | grep `content/blogger/posts/*.md` frontmatter `status: ready` + `publishTargets.blogger.mode: 'full'` |
| 2 | **該 post 之 `relatedLinks` 或 `otherLinks` 中包含至少 1 筆 GitHub Pages cross-link** | grep 該 post `babel-lab.github.io` hostname（per `settings.site.githubSiteUrl`）|
| 3 | **該 link 預期會被 `applyCrossSiteUtm({ direction: 'to_github' })` 處理** | hostname 判斷成立（`isGithubCrossLink` 回 true）；不依賴 frontmatter `kind` 欄位 |

### D.2 Build 階段驗證

| # | 條件 | 對應驗證方法 |
|---|---|---|
| 4 | **`npm run build:blogger` 後 `dist-blogger/posts/{slug}/post.html` 可 grep 到 reverse UTM 完整 4 鍵** | `rg --no-ignore` 同時命中以下 4 個 pattern： |
|   |   | • `utm_source=blogger` |
|   |   | • `utm_medium=referral`（**非** legacy 之 `internal_referral`）|
|   |   | • `utm_campaign=portable_blog_system`（**非** legacy 之 `blogger_to_github`）|
|   |   | • `utm_content=related_links` 或 `utm_content=other_links`（per slot；**非** legacy 之 `{slug}`）|
| 5 | **target / rel 合併正確** | grep 該 link 之 anchor 包含 `target="_blank"` + `rel="nofollow noopener noreferrer"`（順序不限；保留作者既有 token 如 `sponsored`）|
| 6 | **非 GitHub cross-link 不誤注入** | 該 post.html 內其他非 GitHub external link / Blogger-internal link / 同站連結 → 不含 reverse UTM scheme |
| 7 | **legacy `internal_referral` / `blogger_to_github` scheme 不被混淆** | 既有 summary mode posts 之 `dist-blogger/posts/*/post.html` 之 18 個 `utm_medium=internal_referral` 命中 + 18 個 `utm_campaign=blogger_to_github` 命中**不變**（per pm-25 verify §F.3 baseline）|
| 8 | **GitHub → Blogger forward UTM 不受影響** | `.cache/pages/posts/*/index.html`（dev mode）或 `dist/posts/*/index.html`（build mode）內仍正確注入 `utm_source=github_pages&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links`（per pm-25 verify §F.5 baseline）|

### D.3 user-side 同意

| # | 條件 | 性質 |
|---|---|---|
| 9 | **user 願意進行 Blogger 後台手動重貼**（含覆蓋同 slug 既有 post 之決策，如適用）| user 主觀同意 |
| 10 | **user 願意進行 GA4 Realtime 驗收** | user 主觀同意 |
| 11 | **GA4 Realtime / Acquisition 可用**（測試 GA4 measurement ID 之 dataLayer 正常）| 環境前置 |
| 12 | **若 fixture post 為新建非已發布文章**，已決定**驗收後是否保留為正式發布文章**（per fixture-plan §7）| user 主觀同意 |

⛔ **任一條件未滿足 → 不啟動 pm-26；繼續維持 dormant**。

---

## §E. pm-26 未來建議流程（順序）

對齊 `docs/reverse-utm-fixture-plan.md` §10.5 Phase 1-6 之精簡 ordered checklist：

| # | 步驟 | 對應 phase（fixture-plan §10.5）| 動作性質 |
|---|---|---|---|
| 1 | **cold-start baseline 確認** | n/a | `git status --short --branch` / `git rev-parse HEAD` / `git rev-list --left-right --count origin/main...HEAD`；要求 clean + sync |
| 2 | **`npm run smoke:reverse-utm`** | n/a | L1 source-level smoke；exit 0 = pass；exit 非 0 立即停下 |
| 3 | **確認 positive fixture 存在**（per §D.1 條件 1-3）| Phase 1 之後 | grep `content/blogger/posts/*.md` + 對應 GitHub cross-link |
| 4 | **`npm run build:blogger`** | Phase 2 | build dist-blogger；確認無 warning + ready count 正確 |
| 5 | **`npm run build:github`** | Phase 2 | build dist；確認 forward UTM 不受影響 |
| 6 | **grep dist-blogger HTML**（per §D.2 條件 4-7）| Phase 2 | 用 `rg --no-ignore` 驗證 reverse UTM 4 鍵命中 + target/rel + legacy scheme 不變 |
| 7 | **若 dist 驗證通過 → 才進 deploy** | Phase 3 後 | dist 不過 = 不 deploy；source 修正後重 build 重驗 |
| 8 | **deploy gh-pages**（user 手動）| Phase 3 後 | per `docs/20260524-blogger-github-publishing-runbook.md` 之 deploy SOP |
| 9 | **user 手動重貼 Blogger 文章** | Phase 4 | per `docs/20260524-blogger-repost-checklist.md` §2.2（備份）+ §3（重貼步驟）；後續回填 `.publish.json` 之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`；等待 Blogger CDN cache 5-10 分鐘 |
| 10 | **user 進 GA4 Realtime 驗收** | Phase 5 | per `docs/20260524-ga4-reverse-utm-observation.md` §4.2；Chrome 無痕（或 GA Debug Mode）開啟 Blogger 重貼後文章 → 點擊 GitHub cross-link → GA4 Realtime / DebugView 觀察 `utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links`；延遲 < 30 秒；Reports 24-48 小時 |
| 11 | **驗收通過後，另開 docs report 更新 live state** | Phase 6 | 新增 `docs/YYYYMMDD-reverse-utm-fixture-verification-report.md`（per fixture-plan §10.5 Phase 6）；若需更新 `CLAUDE.md` §16.4 之 dormant → live 狀態，另開獨立 docs phase |

→ phase 間依賴：

```
Phase 1 content → Phase 2 build verify → Phase 3 commit + push
                                              │
                                              ↓
Phase 4 Blogger repost → Phase 5 GA4 observe → Phase 6 verification report
```

→ Phase 1-3 屬同一個 commit-push session；Phase 4-5 屬 user 手動操作 + 等待自然讀者流量 / 自我點擊；Phase 6 待驗收結果出爐後落地。

---

## §F. user 手動驗收 checklist

per `docs/20260524-blogger-repost-checklist.md` + `docs/20260524-ga4-reverse-utm-observation.md` 之精簡化：

### F.1 重貼前 — 確認

- [ ] 要重貼的是**哪一篇 Blogger 文章**？slug、`bloggerPostId`、`publishedUrl` 已對齊
- [ ] 該文章是否**已 published**？如是，是否同意**覆蓋既有 published post**？
- [ ] 已 build `dist-blogger/posts/{slug}/post.html` 並 grep 確認 reverse UTM 4 鍵齊全
- [ ] 已備份 Blogger 後台**舊版** HTML（per repost-checklist §2.2；可貼回 fallback）

### F.2 重貼 — 動作

- [ ] 開啟 Blogger 後台該文章 → 切 HTML 模式
- [ ] 全選舊內容 → 貼上 `dist-blogger/posts/{slug}/post.html`
- [ ] 預覽桌機版 / 手機版 → 確認版面無破
- [ ] 確認 AdSense 區塊未破版
- [ ] 圖片可正常顯示
- [ ] 標籤 / 自訂網址不變
- [ ] 「儲存」並等待 Blogger CDN cache 5-10 分鐘

### F.3 驗收 — 觀察

開啟 Chrome 無痕（或 GA Debug Mode extension）：

- [ ] 開啟 Blogger 重貼後之文章 URL（用 publishedUrl）
- [ ] 在頁面內**找到** relatedLinks 或 otherLinks 中之 GitHub Pages cross-link
- [ ] **點擊**該 link
- [ ] **預期**：跳到 GitHub Pages 對應文章；URL 列**包含**：
  - `utm_source=blogger`
  - `utm_medium=referral`
  - `utm_campaign=portable_blog_system`
  - `utm_content=related_links`（從 relatedLinks 點）或 `utm_content=other_links`（從 otherLinks 點）
- [ ] **預期**：開新分頁（`target="_blank"`）；rel 含 `nofollow noopener noreferrer`

### F.4 GA4 Realtime 驗收

per `docs/20260524-ga4-reverse-utm-observation.md` §4.2：

- [ ] GA4 Realtime / DebugView 出現 `page_view` event on GitHub Pages landing page（延遲 < 30 秒）
- [ ] event 之 `page_location` 含完整 4 鍵 reverse UTM
- [ ] `source = blogger` / `medium = referral` / `campaign = portable_blog_system` / `content = related_links | other_links` 在 GA4 Realtime acquisition dimension 出現
- [ ] 與既有 forward UTM（`source = github_pages`）**區分清楚**，無誤混
- [ ] 與既有 legacy summary CTA UTM（`source = blogger` + `medium = internal_referral` + `campaign = blogger_to_github`）**區分清楚**，無誤混

### F.5 若 GA4 看不到 reverse UTM event — 排查順序

per `docs/20260524-ga4-reverse-utm-observation.md` §5：

1. [ ] **廣告阻擋器**：關閉 Chrome 之 uBlock / AdBlock 等；改用無痕模式
2. [ ] **Realtime 延遲**：通常 < 30 秒；偶爾 60 秒；觀察至少 2 分鐘再判定
3. [ ] **連結未更新**：再次在 Blogger 頁面右鍵 → 檢視原始碼 → grep `utm_source=blogger` 確認 HTML 已含正確 UTM；若無 → Blogger 後台貼上時可能被 Blogger HTML sanitizer 改動
4. [ ] **Blogger 快取**：Blogger CDN cache 通常 5-10 分鐘；硬重新整理（Ctrl+Shift+R）強制刷新
5. [ ] **GA4 dataLayer**：Console 執行 `dataLayer` 確認 GA4 measurement ID 正常 fire
6. [ ] **DebugView**：用 GA Debug Mode extension 切 DebugView；比 Realtime 更即時
7. [ ] **Reports 24-48 小時**：Realtime / DebugView 即時；Standard reports 通常需 24-48 小時 aggregate

→ 若以上排查全做完仍 0 命中 → 屬異常；另開 docs phase 詳查（不要直接改 source）。

---

## §G. 明確不做事項（本批 落地保證）

| 項目 | 狀態 |
|---|---|
| 新增 `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（本檔）| ✅ 唯一新增檔案 |
| 修改 `src/` | ❌ 無 |
| 修改 `content/`（任何 `.md` / `.publish.json` / `.fb.md`）| ❌ 無 |
| 修改 `content/settings/` | ❌ 無 |
| 修改 `package.json` | ❌ 無 |
| 修改 `.claude/` | ❌ 無 |
| 修改 `CLAUDE.md` | ❌ 無 |
| 修改其他既有 docs（含 reverse-utm-fixture-plan.md / blogger-to-github-reverse-utm-plan.md / L1-smoke-completion-report.md / pm25-predeploy-verify-report.md / blogger-repost-checklist.md / ga4-reverse-utm-observation.md）| ❌ 無 |
| `npm run build` / `npm run build:blogger` / `npm run build:github` | ❌ 本批不執行 |
| Deploy gh-pages | ❌ 無 |
| git push | ❌ 無 |
| git reset / git rebase / git push --force | ❌ 無 |
| 操作 Blogger 後台（重貼 / 改內容 / 改 Theme CSS）| ❌ 無 |
| 操作 GA4 後台（改 measurement ID / 改 channel grouping / 改 audience）| ❌ 無 |
| 新增 fixture（content/blogger/posts/{date}-{slug}.md 或 .publish.json）| ❌ 無 |
| 啟動 pm-26（per fixture-plan §6 啟動條件）| ❌ 無 |
| 啟動 L2 fixture phase | ❌ 無 |
| 更新 `CLAUDE.md` §16.4 之 live state（dormant → live）| ❌ 無 |

本文件落地後 reverse UTM live 狀態維持 🟡 **landed but dormant**；無 production state drift。

---

## §H. 下一步建議

對齊 `docs/reverse-utm-fixture-plan.md` §10.4 之最低風險 fixture 策略：

### H.1 主軌（推薦）：維持 dormant + 等自然文章

- ✅ **不主動建立 fixture**；reverse UTM live 狀態維持 dormant，無時間壓力
- ✅ **若無 positive fixture，維持 dormant**：當前狀態本身已通過 negative invariant 驗證 + L1 source smoke，無 production 異常
- ✅ **若要自然產生 fixture**：等下一篇書評 / 心得 / 技術文章在內容上**自然引用** GitHub Pages 既有技術文（如 `github-pages-blog-planning` / `portable-blog-system-mvp`）
  - 觸發條件範例：未來作者撰寫之新書評（AI / 自媒體 / 工具書 / 教育類）若主題自然涉及「網站製作 / 部落格策略 / AI 工具」
  - 時程不可預測；屬最高 production-grade 真實性

### H.2 副軌 A（user 自決時機）：主動製造 fixture

- 🟡 **若 user 決定主動製造 fixture** → **另開 L2 fixture phase**（per fixture-plan §10.5 Phase 1）；**不**在本 readiness doc 範圍內啟動
- 提案題目範例（**不**現在落地；僅供未來作者選用）：
  - 「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」
  - 「Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡」
  - 「為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結」
- 屬作者**真實會寫**之文章；驗收完成後若內容合適應**保留為正式 production post**

### H.3 不採用之路線

- ❌ **不**為驗收硬改既有 ready / published 文章（per fixture-plan §2 之 4 個 invariant 衝突：覆蓋 published / 破壞 SEO 策略 / Phase fixture 鎖定衝突 / 主題不自然）
- ❌ **不**寫純測試文（如「reverse UTM fixture」標題、lorem ipsum 內容）
- ❌ **不**在 `content/validation-fixtures/` 內建立 reverse UTM fixture（該目錄專供 validator 錯誤樣本）
- ❌ **不**在無 fixture 之情況下強行 deploy + 重貼 Blogger（會浪費 user 手動操作成本 + 0 GA4 命中 → 無法判斷是 fixture 缺、廣告阻擋、Blogger 快取、還是 source bug）

### H.4 結論

⛔ **pm-26 只能在 positive fixture 存在後啟動**（per §D.1 條件 1-3 + §D.2 條件 4-8 全部成立）。

🟢 **本文件本身為純 docs entry index**；不啟動任何 phase；不改變 production state。

---

## §I. Cross-links

### I.1 reverse UTM 三層 canonical 詳本

- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-site UTM 規則；reverse 方向 source landed but dormant）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12 + §0 status update）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 readiness addendum）

### I.2 5/25 reverse UTM 日內 docs trail

- `docs/20260525-reverse-utm-readiness-snapshot.md`（am-8；本日 readiness 狀態紀錄）
- `docs/20260525-reverse-utm-code-smoke-plan.md`（night-4 之前；L1 smoke plan）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（night-4；L1 smoke completion；commits `6b85ecf` / `81bf950` / `0d6ac84`）
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（night-5；pm-25 pre-deploy verify report；commit `e4feb33`）
- 本檔（night-6；pm-26 pre-flight readiness checklist；待 commit）

### I.3 user 手動操作 SOP

- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP；Theme CSS 重貼 + per-post HTML 重貼 + 備份 / 驗收 / 回滾）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM dormant → live 長期觀察指引）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）

### I.4 規格錨點

- `docs/click-tracking-governance.md` §4 row 3 / §10 順序 5（reverse UTM 規格）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；source landed；dormant）
- `docs/ga4-parameter-naming-registry.md` §4.2（reverse UTM 命名規格）
- `docs/blogger-listener-strategy.md` §5.1（短期推薦方案 D — reverse UTM；listener 短期不做）

---

（本文件結束）
