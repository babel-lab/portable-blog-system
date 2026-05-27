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

（本文件結束）
