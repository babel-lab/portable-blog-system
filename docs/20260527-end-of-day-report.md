# 2026-05-27 End-of-Day Report — sourceKey series

Phase: `20260527-pm-4-sourcekey-session-eod-report-docs-only-precommit-a`

本檔為 2026-05-27 sourceKey 系列之 session checkpoint，供下次 cold-start session 直接讀取。屬 docs-only 單檔 batch；不解除 reverse UTM dormant 狀態；不解除 pm-26 deploy gate；不改動任何 source registry / validate rule / EJS template / Admin selector / GA4 dimension。

---

## 1. Session scope

本日 sourceKey 系列累計工作範圍：

- settings registry（`content/settings/link-sources.json` 初版 8 active sources）
- template sourceKey examples（3 個 Blogger templates 補入 optional `sourceKey` 範例行）
- renderer fallback chain（兩端 EJS 引入 `labelOverride > registry.displayLabel > platform > kind`；無 `sourceKey` 時 fallback 至既有 `platform` 字串，backward compatible）
- validate unknown sourceKey warning（warning-only；`related-links-source-key-not-found`；mirror 既有 4 條 `related-links-*` warning pattern）
- docs marker sync（schema §11.5 + phase-2 §3.8 同步 4 個 step landed 狀態與 commit hashes）
- post-docs-sync triage（read-only 下一步盤點；得出 EOD report 為最低風險小批之結論）

---

## 2. Final baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `189b564118dd91c473f3128a272a99337882d741` |
| origin/main | `189b564118dd91c473f3128a272a99337882d741` |
| short | `189b564` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | `0 errors / 40 warnings / 35 posts` |

---

## 3. Commit timeline

本日 sourceKey 系列相關 commits（時序）：

| commit | message |
|---|---|
| `83f8c1b` | docs(links): add source registry roadmap addendum |
| `c658e1b` | feat(settings): add link source registry |
| `089b157` | refactor(templates): add optional source keys to link examples |
| `d1f1224` | feat(links): wire sourceKey renderer fallback |
| `9ce7e8a` | feat(validate): warn on unknown link sourceKey |
| `d3132d4` | docs(sourcekey): mark step 4 renderer and step 7 not-found as landed |
| `189b564` | docs(sourcekey): mark step 2 settings and step 3 templates as landed |

合計 7 個 commit；5 個實作 commit（settings / templates / renderer / validate + roadmap addendum）+ 2 個 docs marker sync commit。

---

## 4. sourceKey roadmap status

| Step | 狀態 | landed commit | docs marker synced at |
|---|---|---|---|
| Step 1 docs-only roadmap / schema addendum | ✅ landed | `83f8c1b` | initial |
| Step 2 settings-only | ✅ landed | `c658e1b` | `189b564` |
| Step 3 template-only | ✅ landed | `089b157` | `189b564` |
| Step 4 renderer fallback chain | ✅ landed | `d1f1224` | `d3132d4` |
| Step 5 GA4 `link_source_key` | ⏭ not started | — | — |
| Step 6 Admin selector | ⏭ not started | — | — |
| Step 7 `source-key-not-found` warning | ✅ landed | `9ce7e8a` | `d3132d4` |
| Step 7 `source-inactive` warning | ⏭ not started | — | — |
| Step 7 invalid-type / empty warning | ⏭ not started | — | — |

兩份 docs roadmap（`docs/related-links-schema.md` §11.5 + `docs/phase-2-candidate-roadmap.md` §3.8）已對齊；step 4/7 marker sync at `d3132d4`；step 2/3 marker sync at `189b564`。

---

## 5. Natural adoption status

per phase `20260527-pm-3-sourcekey-post-docs-sync-next-work-triage-readonly-a` 之 read-only inspection 結論：

- `content/blogger/posts/` 與 `content/github/posts/` 中 grep `sourceKey:` → **0 命中**
- 實際發布候選文章（we-media-myself2 / draft-book-review / sample-book-review / github-pages-blog-planning / portable-blog-system-mvp）**全未自然採用 sourceKey**
- `sourceKey` 目前僅出現在：
  - 3 個 templates（`blogger-download-template.md` / `blogger-magazine-review-template.md` / `blogger-book-review-template.md`）
  - 1 個 validation fixture（`_test-related-links-source-key-not-found.md`）
- 因此 Step 5 GA4 `link_source_key` event param **現在沒有足夠實際資料價值**（dimension landing 但無真實流量採樣），不建議立即做

---

## 6. Unfinished items and blockers

| 項目 | Blocker / 暫不建議理由 |
|---|---|
| Step 5 GA4 `link_source_key` | production dimension 變動；需 preflight；render 變動需 Blogger 全文重貼；當前 0 natural adoption → 無實際資料價值 |
| Step 6 Admin selector | 屬 Admin write infrastructure；需 atomic write；屬較大工程；非小批 |
| Step 7-c `source-inactive` warning | 目前 `link-sources.json` 8/8 active，**無 inactive source 可實測**；warning rule 觸發路徑缺實測條件 |
| Step 7-d invalid-type / empty `sourceKey` warning | 實務觸發率低；非阻擋性；暫不建議 |
| reverse UTM pm-26 | 仍缺 positive GitHub cross-link fixture（per `docs/20260526-reverse-utm-positive-fixture-scan-report.md` §4 結論 0/5 candidates usable） |

---

## 7. reverse UTM and pm-26 gate

不變項聲明：

- **reverse UTM remains landed but dormant**（per CLAUDE.md §16.4；source 已 push origin/main at pm-24a/b/c；un-deployed；live dormant）
- **pm-26 deploy gate remains BLOCKED**
- blocker：no positive GitHub cross-link fixture（`content/blogger/` 全域 grep `babel-lab.github.io` 仍 0 命中）
- **本日 sourceKey 系列沒有解除此 gate**；sourceKey 與 reverse UTM 屬兩條獨立軌；本日 7 個 commit 全部與 reverse UTM 無關

---

## 8. Recommended next session

下次 cold-start 後優先順序建議：

1. **passive freeze / observation** — 預設安全路徑；今日已完成 sourceKey 主軌 80%（4 step landed / 9 step 總計），剩餘 step 均屬「等條件」狀態
2. 等自然文章開始使用 sourceKey 後，再評估 Step 5 GA4 `link_source_key` dimension landing 時機
3. 若要小批次，可做 **read-only sourceKey adoption scan**：定期重跑 §5 之 grep，紀錄是否有 ready post 開始自然使用 sourceKey
4. 若出現 positive GitHub cross-link fixture（per `docs/reverse-utm-fixture-plan.md` §10.4 主軌之自然文章），再回到 pm-26 deploy gate 之 deploy / 重貼 / GA4 Realtime 驗收流程

不建議下次優先處理之項目：Step 5 / 6 / 7-c / 7-d（理由見 §6）；reverse UTM forced fixture（per `docs/reverse-utm-fixture-plan.md` §2 之 4 個 invariant 衝突）。

---

## 9. Cold-start checklist

下次 session 第一動作（read-only baseline verification）：

```bash
pwd
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count HEAD...origin/main
npm run validate:content
```

預期值：

| 指令 | 預期輸出 |
|---|---|
| `pwd` | `/d/github/blog-new/portable-blog-system` |
| `git status --short --branch` | `## main...origin/main`（無 modified / untracked） |
| `git rev-parse HEAD` | `189b564118dd91c473f3128a272a99337882d741` |
| `git rev-parse origin/main` | `189b564118dd91c473f3128a272a99337882d741` |
| `git rev-list --left-right --count HEAD...origin/main` | `0	0` |
| `npm run validate:content` | `0 error(s) / 40 warning(s) on 35 post(s)` |

若 baseline 與上表不符合 → **立刻停止並回報，不要自行修正**。

---

## 10. 不變項聲明（本 phase）

| 項目 | 狀態 |
|---|---|
| 只新增單一 docs 檔（`docs/20260527-end-of-day-report.md`） | ✅ |
| 修改任何既有檔案 | ❌ 無 |
| commit / push | ❌ 無（pre-commit 停下） |
| build / deploy / Blogger repost / GA4 validation / fixture creation / npm install | ❌ 全否 |
| 改動 Step 5 / 6 / 7-c / 7-d 狀態 | ❌ 否 |
| 解除 reverse UTM dormant | ❌ 否 |
| 解除 pm-26 deploy gate | ❌ 否 |
| 重寫既有 phase report / schema doc / roadmap doc | ❌ 否 |

---

## 11. Afternoon checkpoint — sourceKey Step 7-d landing (pm-12 ~ pm-15)

本節為 2026-05-27 下午 sourceKey 系列之 EOD 補述；屬 docs-only append-only addendum；不重寫既有 §1-§10 內容（為 pm-4 frozen snapshot）。

### A. 本次 checkpoint 範圍

- pm-12 read-only next-step selection（completed）
- pm-13 read-only preanalysis（Step 7-d 設計確認）
- pm-14 Step 7-d 實作 + commit + push
- pm-15 acceptance crosscheck 已完成且全綠
- pm-16 本 checkpoint 為 docs-only / append-only

### B. 最新 baseline（pm-14 Step 7-d landing 之後；pm-16 EOD commit 之前）

- HEAD = origin/main = `702e5dbd2dcbf06ae6a5159038f5d282d3e29ad3`
- short = `702e5db`
- working tree clean
- ahead / behind = `0 / 0`
- `npm run validate:content` = `0 error(s) / 42 warning(s) on 37 post(s)`

### C. pm-14 commit 摘要

- commit: `702e5dbd2dcbf06ae6a5159038f5d282d3e29ad3` / short `702e5db`
- message: `feat(validate): warn on invalid sourceKey values`
- date: 2026-05-27 15:25 +0800
- scope: exactly 5 files
  1. `src/scripts/validate-content.js`
  2. `content/validation-fixtures/blogger/posts/_test-related-links-source-key-invalid-type.md`
  3. `content/validation-fixtures/blogger/posts/_test-related-links-source-key-empty.md`
  4. `docs/related-links-schema.md`
  5. `docs/phase-2-candidate-roadmap.md`
- validate baseline drift: `0/40/35` → `0/42/37`（+2 warnings / +2 posts；mirror 9-g-c-c fixture additive pattern；非 regression）

### D. Step 7-d 功能摘要

新增 2 條 warning rules（且既有 not-found 改寫為 if / else if / else if 互斥結構，行為不變）：

- `related-links-source-key-invalid-type` — `entry.sourceKey` 存在且 `typeof !== 'string'`（含 number / boolean / null / object / array 五類）
- `related-links-source-key-empty` — `entry.sourceKey` 為 string 且 `trim() === ''`（含 `""` / 純空白）
- `related-links-source-key-not-found` — non-empty trimmed string 不在 active registry（既有；行為不變）

互斥結構（per `src/scripts/validate-content.js:212-238`）：

```
if (entry.sourceKey !== undefined) {
  if (typeof !== 'string')         → invalid-type
  else if (trim() === '')          → empty
  else if (not in activeSourceKeys) → not-found
}
```

- `undefined` 不觸發任一條（保留 optional 欄位語意）
- 同 entry 之 sourceKey 最多觸發 1 條
- 既有 EJS render-time gate（`typeof === 'string' && trim() !== ''`，per `src/views/pages/post-detail.ejs:180/220`）對 GA4 dimension 之 self-protection 不變

### E. pm-15 acceptance 摘要

- §A commit scope exact 5 files ✅
- §B validate-content.js acceptance passed ✅（三條互斥邏輯確認；undefined skip；null / number / boolean / object / array 全觸發 invalid-type；empty / whitespace-only 觸發 empty；既有 not-found 行為未破壞）
- §C fixture acceptance passed ✅（位置 `content/validation-fixtures/blogger/posts/` / 寫法 `sourceKey: 123` + `sourceKey: ""` / 不影響 ready posts）
- §D docs acceptance passed ✅（schema §3.3 table 補 #5/#6/#7 + §11.5 step 7 marker / roadmap §3.8 step 7 marker；唯 phase-2 roadmap 用 phase name `Phase 20260527-pm-14` 而非 literal `702e5db` 屬 🟡 partial → 本 EOD checkpoint 即補上 literal `702e5db` 紀錄）
- §E 禁區 acceptance passed ✅（16+ 禁區檔案皆未動）
- pm-15 期間：no source / Blogger / Admin / link-sources / templates / formal content posts 變更；no build / deploy / Blogger repost / GA4 validation / npm install

### F. 現在 sourceKey roadmap 狀態

| Step | 狀態 | landed commit / 阻擋 |
|---|---|---|
| Step 1 docs roadmap / schema addendum | ✅ landed | `83f8c1b` |
| Step 2 `link-sources.json` 初版 registry（8 active sources） | ✅ landed | `c658e1b` |
| Step 3 templates sourceKey samples（3 Blogger templates） | ✅ landed | `089b157` |
| Step 4 renderer fallback chain（兩端 EJS + `deriveRenderedCrossLinks`） | ✅ landed | `d1f1224` |
| Step 5 GA4 `link_source_key` source | ✅ landed | `310062d` |
| Step 5 docs sync（4 docs） | ✅ landed | `1707881` |
| Step 7 `source-key-not-found` | ✅ landed | `9ce7e8a` |
| Step 7-d `source-key-invalid-type` | ✅ landed | `702e5db` |
| Step 7-d `source-key-empty` | ✅ landed | `702e5db` |
| Step 7-c `source-inactive` | ⏭ not started | — |
| Step 6 Admin selector | ⏭ not started | — |

### G. 仍未做 / blocked

- **Step 7-c source-inactive warning** — 原因：目前 `content/settings/link-sources.json` 8/8 sources 全 `isActive: true`；無 inactive source 可自然實測；若實作需動 registry semantic（將某 source 設 `isActive: false`）或繞道
- **Step 6 Admin selector** — 原因：Admin write infra 未就位（`src/scripts/save-admin-posts.js` 不存在；當前 Admin 僅 read-only display 顯示 relatedLinks / otherLinks count，per `src/views/admin/index.ejs:590-595`）；依賴 FB-P5-c / Admin-2-b-2 atomic write 系列；屬大批工程
- **GA4 validation** — not done（屬 deploy 後 user 手動於 GA4 DebugView 驗收 `click_related_link` / `click_other_link` event 之 `link_source_key` param）
- **build / deploy** — not done（本日無 `npm run build` / 無 gh-pages 操作；source 已 push origin/main，等下次自然 deploy）
- **Blogger repost** — not done / N/A（Blogger render 端完全未動，無重貼需求）
- **reverse UTM** — remains landed-but-dormant（pm-24a/b/c at 2026-05-23；未 deploy；未重貼 Blogger）
- **pm-26 deploy gate** — remains BLOCKED on no positive GitHub cross-link fixture（per `docs/20260526-reverse-utm-positive-fixture-scan-report.md`）

### H. 下一 session cold-start 建議

下一 session 第一動作（read-only baseline verification）：

```bash
pwd                                    # → /d/github/blog-new/portable-blog-system
git rev-parse HEAD                     # → 應為本 pm-16 EOD commit hash（pm-14 之上 +1 docs-only commit）
git rev-parse origin/main              # → 同 HEAD
git rev-list --left-right --count HEAD...origin/main  # → 0	0
git status --short --branch            # → ## main...origin/main（無 modified / untracked）
npm run validate:content               # → 0 error(s) / 42 warning(s) on 37 post(s)
```

substantive feature baseline 參照：

- pm-14 Step 7-d source landing commit = `702e5db`（feature ship 之 substantive commit）
- pm-16 EOD checkpoint commit = （本 commit；pm-14 之上 +1 docs-only commit；非 substantive 變動）
- reverse UTM dormant
- pm-26 deploy gate blocked

若 baseline 與上表不符 → 立即停止並回報；不自行修正。

### I. 下一步候選（記錄；不執行）

1. **Final Idle Freeze** — 收尾今日工作；最保守路徑；今日累計 10 commits across pm-4 ~ pm-16
2. **Step 7-c source-inactive warning preanalysis**（read-only） — 盤點 inactive warning 設計；但 audit 結論於 pm-11 / pm-13 已部分展開
3. **Step 6 Admin selector preflight**（read-only） — 屬大批前置；依賴 Admin write infra 未就位
4. **future docs sync only if needed** — 若發現 drift 再 sync

---

（本文件結束）
