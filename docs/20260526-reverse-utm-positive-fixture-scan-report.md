# 20260526 Reverse UTM Positive Fixture Scan Report

Phase: `20260526-am-4-reverse-utm-positive-fixture-scan-report-docs-only-a`
Date: 2026-05-26
Scope: docs-only（唯一新增檔；本檔即本 phase 全部 artifact）

---

## 1. Context

- **README rewrite** 已完成並通過 acceptance cross-check（per phase `20260526-am-1-readme-rewrite-docs-only-a` commit `810dbe7` + phase `20260526-am-2-readme-rewrite-acceptance-crosscheck-readonly-a` 通過）。
- **reverse UTM source** 已 landed（pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`，2026-05-23），三 commits 已 push origin/main。
- **reverse UTM live 狀態** 仍 🟡 **landed but dormant**（per `CLAUDE.md` §16.4）。
- 本 report 為 phase `20260526-am-3-reverse-utm-positive-fixture-readiness-scan-readonly-a` 之 **read-only fixture readiness scan** 結果之 docs landing；am-3 phase 屬 read-only 不產生 docs artifact，本 report 補上落地紀錄供未來 cold-start session / deploy decision 直接讀取。
- 本 report **不**取代以下既有 reverse UTM canonical 文件；僅為其 5/26 snapshot index：
  - `CLAUDE.md` §16.4（reverse UTM 規格主錨）
  - `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 addendum）
  - `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（pm-26 pre-flight readiness）
  - `docs/20260525-deploy-diff-dry-run-readonly-report.md`（deploy diff dry-run）

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| branch | `main` |
| HEAD | `810dbe741dc08c5104c0a2856ad4c3c91bda3e51`（short `810dbe7`）|
| origin/main | `810dbe741dc08c5104c0a2856ad4c3c91bda3e51` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`）|
| 是否 read-only scan | ✅ 是（am-3 phase 完成；本 am-4 report 為 docs landing；scan 動作未重做）|
| reverse UTM live 狀態 | 🟡 landed but dormant |

→ baseline 完全對齊 am-3 read-only scan 啟動時之狀態；本 docs landing 不改變此狀態。

---

## 3. Scan Scope

### 3.1 文件脈絡比對

- `docs/reverse-utm-fixture-plan.md` §0 / §3 / §6 / §10（fixture 設計原則 + 啟動條件 + 5/24 readiness review addendum）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §C / §D（pm-26 不可啟動之原因 + 啟動條件 D.1-D.3）
- `docs/20260525-deploy-diff-dry-run-readonly-report.md` §F（fixture 缺席 root cause + GA4 0 命中歸因不可分辨）
- `README.md`（含 reverse UTM dormant 段落 line 159 + 175）

### 3.2 內容資料夾與檔案

| 範圍 | 對象 |
|---|---|
| `content/blogger/posts/` | 3 篇 .md（we-media-myself2 / sample-book-review / draft-book-review）+ 2 publish.json + 2 fb.md |
| `content/github/posts/` | 2 篇 .md（github-pages-blog-planning / portable-blog-system-mvp）+ 1 fb.md |
| `content/shared/posts/` | 空（僅 `.gitkeep`）|
| `content/settings/` | site.config.json（讀取 `githubSiteUrl` = `https://babel-lab.github.io/portable-blog-system`）|
| `content/**/*.json` | 涵蓋上述 publish.json / settings JSON |
| `content/**/*.md` | 涵蓋上述 blogger / github posts |

### 3.3 Grep pattern

主要 grep：

- `babel-lab\.github\.io|babel-lab/portable-blog-system` 於 `content/`
- `relatedLinks|otherLinks|publishTargets|mode:|bloggerMode` 於 `content/blogger/posts/`

輔助 read：

- `we-media-myself2.md` 全檔 frontmatter（含 relatedLinks / otherLinks / publishTargets）
- `we-media-myself2.publish.json`（含 blogger.publishedUrl / github.path）
- `draft-book-review.md` 全檔 + `draft-book-review.publish.json`
- `sample-book-review.md` 全檔
- 2 篇 github posts 全檔（確認 target URL pattern）

### 3.4 是否執行 build / deploy / Blogger 操作 / GA4 操作

❌ 全部未執行；本 scan 純 read-only。

---

## 4. Candidate Fixture Findings

### 4.1 候選清單

| Candidate ID | Blogger source post | GitHub target post / URL | Link location | publish status | noindex / draft 狀態 | 是否可作為 positive fixture | 缺口 |
|---|---|---|---|---|---|---|---|
| **C1** | `we-media-myself2`（`2026-05-15`；book-review；blogger.mode=full）| n/a — 無引用 | n/a | Blogger: **published**（`https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`）/ GitHub: enabled, mode=full | `ready` / `draft: false` / no `seo.indexing` | ❌ **No** | `relatedLinks` 僅含 1 筆 Blogger-internal cross-link（`kind: internal`, `platform: "blogger"`, url=`https://babel-lab.blogspot.com/2026/04/we-media-myself.html`）；`otherLinks: []`；零 `babel-lab.github.io` 引用 |
| **C2** | `sample-book-review`（`2026-05-04`；book-review；blogger.mode=full）| n/a | n/a | n/a（draft）| `draft` / `draft: true` | 🚫 **Unusable** | 永遠不 export（draft）；無 `relatedLinks` / `otherLinks` 欄位；無 publish.json sidecar |
| **C3** | `draft-book-review`（`2026-05-25`；book-review；blogger.mode=full；github.enabled=**false**）| n/a | n/a | n/a（draft）| `draft` / `draft: true` | 🚫 **Unusable** | 永遠不 export（draft）；`relatedLinks: []`、`otherLinks: []`；內容為 TODO skeleton |
| **C4**（hypothetical 改造）| `github-pages-blog-planning` 轉 Blogger full | 自身轉換 | n/a | `ready` / blogger.mode=**summary** | `ready` | ❌ **No**（理論可改造但不採用）| 須將 `blogger.mode: summary → full` |
| **C5**（hypothetical 改造）| `portable-blog-system-mvp` 轉 Blogger full | 自身轉換 | n/a | `ready` / blogger.mode=**summary** / `seo.indexing: noindex-follow` | `ready` | 🚫 **Unusable** | 已被 Phase 20260520-seo-2 / seo-3 鎖定為 SEO fixture sample |

### 4.2 不採用之理由（per `docs/reverse-utm-fixture-plan.md` §2）

| Candidate | 不採用理由 | 風險 |
|---|---|---|
| C1（改 `we-media-myself2` 之 relatedLinks）| 覆蓋既有 published Blogger post；書評→tech-note 主題不自然；破壞「書評末尾只導 Blogger 同主題前作」之既有策略 invariant | ⚠️ 中高 |
| C2 / C3 | draft 永不 export；無 export 路徑可觸發 reverse UTM 注入 | 🚫 結構性不可選 |
| C4（轉 `github-pages-blog-planning` 為 Blogger full）| 破壞 publish strategy（Blogger summary → GitHub full）+ 破壞 canonical / JSON-LD / noindex-follow / summary CTA GA4 數據連續性 | ⚠️ 高 |
| C5（轉 `portable-blog-system-mvp` 為 Blogger full）| 已被 Phase 20260520-seo-2 / seo-3 鎖定為 SEO copy-helper [14] noindex-follow path 驗證樣本；與既有 Phase fixture invariant 衝突 | 🚫 不可重用 |

### 4.3 判斷結論

| 維度 | 結果 |
|---|---|
| 找到之 candidates | **5** |
| 結構上可作為 usable positive GitHub cross-link fixture | **0** |
| 共同 invariant | ⛔ 無任一現有候選可改造而不破壞既有 invariant（per fixture-plan §10.3）|

---

## 5. Gate Decision

⛔ **pm-26 deploy gate remains BLOCKED**。

### 5.1 原因

| 原因 | 依據 |
|---|---|
| **positive GitHub cross-link fixture 不存在** | per §4 之 0 / 5 結論；`content/blogger/` 全域 `babel-lab.github.io` grep 0 命中 |
| **`docs/reverse-utm-fixture-plan.md` §6 條件 1 未滿足** | 條件 1：「已存在至少 1 篇符合 §3 / §4 之 fixture post」→ 不成立 |
| **`docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §D.1 條件 1-3 未滿足** | D.1-1：「ready Blogger full-mode post」→ 1 篇（C1）；D.1-2：「該 post 之 relatedLinks 或 otherLinks 中包含至少 1 筆 GitHub Pages cross-link」→ ❌ 不成立；D.1-3：「該 link 預期被 `applyCrossSiteUtm({ direction: 'to_github' })` 處理」→ n/a |

### 5.2 若僅為驗 reverse UTM，不建議 deploy

per `docs/20260525-deploy-diff-dry-run-readonly-report.md` §F.3-§F.4：

- 若強行 deploy + 重貼 + 觀察 GA4 而見 0 命中，**無法分辨**是 (a) fixture 缺、(b) 廣告阻擋器、(c) Blogger CDN cache、(d) source bug 哪一個原因
- 浪費 user 手動重貼成本（~15 step / 5-10 分鐘）+ 等候 Blogger CDN cache（5-10 分鐘）+ 無診斷價值
- 維持 dormant 之風險 = 0；pm-26 啟動條件不成立

---

## 6. Production State

| 維度 | 結果 |
|---|---|
| vs `docs/20260525-deploy-diff-dry-run-readonly-report.md`（5/25 night-8 dry-run audit）| **0 drift** |
| 無新 Blogger fixture | ✅（5/23 ~ 5/26 無新增 Blogger full-mode ready post）|
| 無新 cross-link | ✅（content/blogger/ 全域 `babel-lab.github.io` grep 仍 0 命中）|
| 無 fixture breakthrough | ✅（fixture-plan §10.2 deadlock 維持）|
| 本 phase 是否 deploy / repost / GA4 validation | ❌ no deploy / no repost / no GA4 validation |
| reverse UTM live 狀態 | 🟡 landed but dormant（自 5/23 pm-24 source landing 以來 production state drift = 0）|

---

## 7. Next Options

### 7.1 Option α — Docs-only report

🟢 **推薦**。本 report 即為此選項落地。

- 動作：新增 `docs/20260526-reverse-utm-positive-fixture-scan-report.md`（本檔）；commit + push origin/main
- 風險：0；無 production state 變動
- 對齊 mirror：am-5 / am-6 → night-12 / night-13 → am-1 / am-2 之 audit-doc-then-act 拆批模式

### 7.2 Option β — Content-only natural fixture

🟡 **副軌；本 phase 不啟動**。

- 動作：新建一篇 Blogger full-mode 心得 / 雙站經營文章（per `docs/reverse-utm-fixture-plan.md` §4.2 副軌 A），主題自然引用 `github-pages-blog-planning` 或 `portable-blog-system-mvp`
- 提案題目範例（per fixture-plan §10.4；**不**現在落地）：
  - 「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」
  - 「Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡」
  - 「為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結」
- 觸發條件：**user 主觀同意**主動製造 fixture 之時機（無時間壓力；fixture-plan §10.4 主軌為等自然文章）
- 屬「L2 fixture phase」起點（per fixture-plan §10.5 Phase 1）；本 phase 不啟動

### 7.3 Option γ — Modify existing published Blogger post

🔴 **不推薦**。

- 動作：為既有 published Blogger post（如 `we-media-myself2`）硬加 GitHub cross-link
- 不採用理由：per §4.2 + `docs/reverse-utm-fixture-plan.md` §2 全部 4 個 invariant 衝突：
  - ⚠️ 覆蓋既有已發布 production 內容
  - ⚠️ 主題不自然（書評 → tech-note 延伸閱讀）
  - ⚠️ 破壞「書評末尾只導 Blogger 同主題前作」既有策略 invariant
  - ⚠️ 若改 mode → 與 SEO 策略連續性衝突
- 即使技術上可行，不適合作為主軌

### 7.4 主軌定論

per `docs/reverse-utm-fixture-plan.md` §10.4：

🟢 **主軌維持等待自然文章產生 positive fixture**。

- 等下一篇自然書評 / 心得 / 技術文章在內容上自然引用 GitHub Pages 既有技術文（如 `github-pages-blog-planning` / `portable-blog-system-mvp`）
- 時程不可預測；屬最高 production-grade 真實性
- 無時間壓力；dormant 屬 expected default state，非 tracking 壞掉

---

## 8. Final Boundary Statement

| 項目 | 狀態 |
|---|---|
| docs-only | ✅ |
| only new report doc added（`docs/20260526-reverse-utm-positive-fixture-scan-report.md`）| ✅ |
| no README change | ✅ |
| no src change | ✅ |
| no content change（任何 `content/**/*.md` / `.publish.json` / `.fb.md`）| ✅ |
| no settings change | ✅ |
| no `package.json` / `package-lock.json` / `vite.config.js` change | ✅ |
| no build（`npm run build*` / `validate:content` / `report:*` / `check:*` / `smoke:*` 一律不執行）| ✅ |
| no deploy（不切換 gh-pages branch / 不碰 `portable-blog-deploy/`）| ✅ |
| no Blogger repost | ✅ |
| no GA4 validation | ✅ |
| 不啟動 Option β（content phase）| ✅ |
| 不啟動 pm-26 deploy gate | ✅ |
| reverse UTM remains landed but dormant | ✅ |
| pm-26 deploy gate remains BLOCKED | ✅ |

本檔落地後 production state drift = 0；屬純 docs entry index 與 5/26 snapshot 紀錄。

---

## 9. Cross-links

### 9.1 reverse UTM canonical（規格與設計主錨）

- `CLAUDE.md` §16.4（reverse UTM 規格主錨；source landed but dormant）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan）
- `docs/reverse-utm-fixture-plan.md`（fixture 設計 SOP §0-§9 + §10 readiness addendum）

### 9.2 reverse UTM 5/25 docs trail

- `docs/20260525-reverse-utm-readiness-snapshot.md`（am-8）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（night-4；commits `6b85ecf` / `81bf950` / `0d6ac84`）
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（night-5；commit `eb42e00`）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（night-6；commit `31c7b41`）
- `docs/20260525-deploy-diff-dry-run-readonly-report.md`（night-8；commit `30cdadf`）
- `docs/20260525-readme-drift-audit.md`（night-13；commit `f93703b`）

### 9.3 5/26 連續 phase trail

- `20260526-am-1-readme-rewrite-docs-only-a`（README rewrite；commit `810dbe7`）
- `20260526-am-2-readme-rewrite-acceptance-crosscheck-readonly-a`（acceptance 通過；read-only；無 commit）
- `20260526-am-3-reverse-utm-positive-fixture-readiness-scan-readonly-a`（fixture scan；read-only；無 commit）
- `20260526-am-4-reverse-utm-positive-fixture-scan-report-docs-only-a`（**本 phase**；docs landing）

### 9.4 user 手動操作 SOP（pm-26 未來啟動才會用到；本 phase 不啟動）

- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台重貼 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM 觀察 SOP）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）

---

（本文件結束）
