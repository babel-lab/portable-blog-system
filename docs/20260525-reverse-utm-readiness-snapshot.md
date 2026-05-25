# 2026-05-25 Reverse UTM Readiness Snapshot

> Phase: `20260525-am-8-reverse-utm-readiness-snapshot-doc-a`
> 模式：docs-only（純 readiness snapshot 落地；**不**建立 fixture）
> 來源：本文件為 Phase `20260525-am-7-reverse-utm-readiness-readonly-a` 之 read-only readiness audit 結果整理。

---

## §1 文件目的與範圍

### 1.1 本文件是什麼

本文件為 **2026-05-25 對 Reverse UTM / Blogger → GitHub Pages tracking 當前狀態** 之 readiness snapshot。屬 docs-only / 狀態紀錄性質；保留為未來 cold-start onboarding / 啟動 fixture 前之 baseline reference。

### 1.2 本文件不是什麼

- ❌ **不是**新 spec（規格屬 `docs/blogger-to-github-reverse-utm-plan.md` §1-§12 + `docs/reverse-utm-fixture-plan.md`）
- ❌ **不是**啟動指令（不啟動 fixture create / Blogger 重貼 / GA4 驗收）
- ❌ **不是** roadmap（候選路線屬 `docs/reverse-utm-fixture-plan.md` §10.5）
- ❌ **不取代** `docs/reverse-utm-fixture-plan.md` §10 addendum（5/24 am-9c readiness review snapshot）

### 1.3 本 phase 之嚴格邊界

本 phase 屬 docs-only：

- ❌ 不建立 fixture（不新增 `content/blogger/posts/*.md` / `.publish.json` / `.fb.md`）
- ❌ 不 build / 不 validate（雖屬 read-only 但本 phase 不需要）
- ❌ 不 deploy / 不 push gh-pages
- ❌ 不重貼 Blogger 後台（per `docs/20260524-blogger-repost-checklist.md`）
- ❌ 不操作 GA4 後台（per `docs/20260524-ga4-reverse-utm-observation.md`）
- ❌ 不 commit / 不 push（待 user 決定）
- ✅ 唯一允許：新增本檔 `docs/20260525-reverse-utm-readiness-snapshot.md`

---

## §2 Audit baseline

### 2.1 git baseline（snapshot 啟動時）

| 項目 | 值 |
|------|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `d6a8922e6c6e51ad4bdbff6f70d17b089c9b75e0`（short `d6a8922`；上一 phase `20260525-am-6` commit）|
| origin/main | `d6a8922e6c6e51ad4bdbff6f70d17b089c9b75e0` |
| ahead / behind | `0 / 0` |
| working tree | clean |

### 2.2 本批 read-only 檢查範圍

| 檢查 | 方式 | 結果 |
|------|------|------|
| pm-24 source 仍 in place | grep `isGithubCrossLink` / `direction:'to_github'` / `deriveRenderedCrossLinks` 於 `src/` | ✅ 3 檔皆命中（`src/scripts/ga4-url-builder.js` / `src/scripts/build-blogger.js` / `src/scripts/build-github.js`） |
| dist-blogger 是否含 reverse UTM 注入 | grep `utm_source=blogger` 於 `dist-blogger/` | ✅ 0 命中（確認 dormant；無 fixture 觸發）|
| `content/blogger/` 是否有 GitHub cross-link | grep `babel-lab.github.io` 於 `content/blogger/` | ✅ 0 命中（we-media-myself2 之 relatedLinks 不含 GitHub cross-link）|
| validation-fixtures 是否有 reverse UTM 專屬 fixture | grep `reverse / github cross / github_pages` 於 `content/validation-fixtures/` | ✅ 命中僅 SEO fixtures（純文字 noise；非 reverse UTM 專屬 fixture）|
| ga4.config.json 狀態 | direct read | ✅ `enabled: true` + `measurementId: "G-C77SMPF8VD"`（GitHub 端 GA4 live）|

**任何 npm script 是否執行**：❌ 否。本 phase 純 grep / read 檔案；不執行 `validate:content` / `build:*` / `report:*` / `check:*`。

### 2.3 參考文件

本 readiness snapshot 之比對與引用依據：

- `docs/reverse-utm-fixture-plan.md`（含 §0-§9 fixture 設計 SOP + §10 5/24 am-9b readiness addendum；canonical fixture entry）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12 + §0 status update）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM 觀察 SOP）
- `docs/20260524-eod-report.md`（5/24 全日收尾；§9 deferred items + §15 docs trail map）
- `docs/20260525-phase1-usability-review.md`（本日 am-3 commit `d13174f`；§3.4 GA4 維度 + §5.2 痛點 #3 reverse UTM dormant）
- `docs/20260525-phase1-user-guide-drift-check.md`（本日 am-5 commit `dc167a6`；D5 §7 GA4 rewrite 含 reverse UTM dormant 段）

---

## §3 Reverse UTM 當前狀態表

| 項目 | 狀態 | 證據 / 來源 |
|------|------|------------|
| **reverse UTM source landed** | ✅ | pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`（2026-05-23）；grep 確認 `isGithubCrossLink` / `direction:'to_github'` / `deriveRenderedCrossLinks` 仍 in place |
| **build verification（pm-24d 結果仍有效）** | ✅ | `dist-blogger/` 0 個 `utm_source=blogger` 命中；「無 GitHub cross-link 之 ready post 無新 UTM 注入」invariant 維持 |
| **ready full-mode Blogger post** | 1 篇（`we-media-myself2`） | `content/blogger/posts/20260515-we-media-myself2.md`；無新候選 |
| **該 post 是否含 GitHub cross-link** | ❌ 0 個 | grep `babel-lab.github.io` 於 `content/blogger/`：0 命中 |
| **reverse UTM fixture / sample / validation-fixture** | ❌ 不存在 | `content/validation-fixtures/` 內無 reverse UTM 專屬 fixture；既有 7 個 SEO fixtures 為 keyword noise，非 reverse UTM 相關 |
| **Blogger 後台重貼** | ❌ 尚未 | per `docs/reverse-utm-fixture-plan.md` §10.1 / §0 status；am-8b checklist SOP 已備但未啟動 |
| **GA4 reverse direction production traffic** | ❌ 0 session / 尚無 | 必然結果（fixture 未建 + 後台未重貼）；per `docs/20260524-ga4-reverse-utm-observation.md` §5.1 「sources/medium 無 reverse UTM 為 expected default state」 |
| **GitHub 端 GA4** | ✅ live | `ga4.config.json`：`enabled: true` + `measurementId: "G-C77SMPF8VD"`；5/24 G2 fix deploy `960f234`；user manual validation passed（per `docs/20260524-eod-report.md` §5.6） |
| **Blogger 端 click tracking** | 🔴 不做（設計層決議） | per `docs/blogger-listener-strategy.md` §5.1 短期推薦不做；reverse UTM 為短期方案 |
| **live 狀態** | 🟡 **dormant 維持** | 完全對齊 5/24 am-9b snapshot |

---

## §4 Source live but dormant 確認

### 4.1 結論

✅ **完全符合 source live but dormant**。

### 4.2 5/24 am-9b 與 5/25 am-7 對照

| 維度 | 5/24 am-9b（per `reverse-utm-fixture-plan.md` §10.1）| 5/25 am-7 | drift |
|------|---------|----------|-------|
| reverse UTM source landed | ✅ pm-24a/b/c | ✅ unchanged | 0 |
| build verification | ✅ pm-24d | ✅ 仍有效（dist-blogger 0 reverse UTM 命中對齊「無 cross-link 不注入」invariant）| 0 |
| 唯一 ready full-mode Blogger post | `we-media-myself2` | `we-media-myself2`（無新候選） | 0 |
| 該 post 含 GitHub cross-link？ | ❌ | ❌（grep 確認） | 0 |
| Blogger 後台重貼 | ❌ | ❌ | 0 |
| GA4 Realtime 驗收 | ❌ | ❌ | 0 |
| live status | 🟡 dormant | 🟡 dormant | 0 |

### 4.3 結論

**5/24 → 5/25 production state drift = 0**。所有 reverse UTM readiness 維度自 5/24 am-9b 以來未漂移。

---

## §5 已完成 / 未完成 / blocked / deferred

### §5.1 ✅ 已完成

| 項目 | 落地時點 | commit / phase |
|------|---------|---------------|
| Reverse UTM source 三層接入（helper / preprocess / template） | 2026-05-23 | pm-24a `7e1d356`（`ga4-url-builder.js`）+ pm-24b `e2309e9`（`build-blogger.js`）+ pm-24c `7c769fe`（`blogger-post-full.ejs`） |
| Build verification（dist-blogger 既有 3 ready posts byte-identical-modulo-builtAt；無 cross-link 之 post 無新 UTM）| 2026-05-23 | pm-24d |
| 原 plan docs（reverse UTM step 1 spec）| 2026-05-22 | `20260522-blogger-to-github-reverse-utm-plan-a` |
| `docs/reverse-utm-fixture-plan.md`（fixture 建立 SOP；含 §0-§9）| 2026-05-23 | pm-29b `20260523-pm-29b-reverse-utm-fixture-plan-a` |
| `docs/20260524-ga4-reverse-utm-observation.md`（observation guide）| 2026-05-24 | am-8c `fc2a852` |
| `docs/20260524-blogger-repost-checklist.md`（Blogger 後台重貼 SOP）| 2026-05-24 | am-8b `058ebce` |
| `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）| 2026-05-24 | am-10a / am-10b `0b62a13` |
| `reverse-utm-fixture-plan.md` §10 readiness addendum | 2026-05-24 | am-9c `72ee459` |
| `docs/phase-1-user-operation-guide.md` §7 已 sync reverse UTM dormant 狀態 | 2026-05-25 | am-6 `d6a8922` |

### §5.2 ❌ 未完成

| 項目 | blocking 因素 |
|------|--------------|
| fixture post 建立（含 GitHub cross-link 之 full-mode Blogger ready post） | 既有候選皆破壞 invariant（per `reverse-utm-fixture-plan.md` §2 / §10.3）；「不能改既有 + 沒有新自然文章」deadlock 未解 |
| Blogger 後台 per-post HTML 重貼 | 前置依賴 fixture 建立；屬 user 手動操作 |
| GA4 Realtime reverse UTM 驗收 | 前置依賴重貼 + 點擊 + 等 CDN cache（5-10 min） |
| verification report（fixture-plan §10.5 Phase 6）| 全卡 fixture |

### §5.3 🟡 Blocked / Deferred

| 項目 | 狀態 | blocker / trigger |
|------|------|------------------|
| fixture create | ⏸ user 自決時機 | 等自然書評 / 心得文章主題契合 GitHub 站；或 user 決定副軌 A（雙站心得文）|
| Blogger 後台重貼 | ⏸ blocked on fixture | 同上 |
| GA4 Realtime 驗收 | ⏸ blocked on Blogger 重貼 | 同上 |
| verification report | ⏸ blocked on GA4 驗收 | 同上 |
| Blogger 端 click listener | 🔴 短期不做 | per `docs/blogger-listener-strategy.md` §5.1（推薦先採 reverse UTM；listener 為中長期）|
| Article body inline cross-link 之 reverse UTM 注入 | 🔴 第一階段不做 | per `docs/blogger-to-github-reverse-utm-plan.md` §6.2；僅 `relatedLinks` / `otherLinks` 兩 aside slot |

---

## §6 風險判斷

| # | 風險面向 | 等級 | 說明 |
|---|---------|-----|------|
| 1 | production state drift | 🟢 **無** | dist-blogger 0 個 reverse UTM 命中；source / docs 對齊；無 surprise |
| 2 | source live but dormant 之語義誤判 | 🟢 低 | `docs/20260524-ga4-reverse-utm-observation.md` §5.1 已明確「沒有流量 ≠ tracking 壞掉」；dormant 屬 expected default state |
| 3 | 因 fixture 缺而失去驗收機會 | 🟢 低 | 5/22 起 deferred 至今無時間壓力；`reverse-utm-fixture-plan.md` §10.4 明確「無時間壓力 + 無明確驗收 deadline」 |
| 4 | 因 deadlock 強改既有 post 之風險 | 🔴 **高（需主動避免）** | per `reverse-utm-fixture-plan.md` §2：所有候選改造皆破壞 invariant（已發布覆蓋 / SEO 策略斷裂 / Phase fixture 鎖定衝突 / 讀者觀感）；應堅守「不能改既有 + 等自然文章」原則 |
| 5 | docs trail drift | 🟢 **無** | 5/22 ~ 5/24 三層 SOP（fixture-plan + repost-checklist + observation guide）+ runbook + §10 addendum 完整；5/25 已 sync user-guide §7 |
| 6 | 本機 PC vs NB drift | 🟢 **無** | 5/25 am-1 PC handoff baseline 已驗 HEAD ≡ origin；5/25 上午 4 commits 全 push origin |

### 6.7 整體風險評估

🟢 **低** — 屬「expected dormant」之穩定狀態；無 production 異常；無 docs / source / dist drift。

---

## §7 不建議現在建立 fixture

### 7.1 明確結論

⛔ **不建議現在為了驗收硬建 fixture**。

### 7.2 理由

| # | 理由 | 來源 |
|---|------|------|
| 1 | **無時間壓力** | 5/22 起 deferred 至今無 deadline；`reverse-utm-fixture-plan.md` §8.1 主軌 |
| 2 | **無明確驗收 deadline** | 不為任何 phase / release 必經阻擋；`reverse-utm-fixture-plan.md` §10.4 |
| 3 | **既有候選皆破壞 invariant** | `reverse-utm-fixture-plan.md` §2（we-media-myself2 / github-pages-blog-planning / portable-blog-system-mvp / sample-book-review 各有 blocking）+ §10.3 |
| 4 | **「不能改既有 + 沒有新自然文章」deadlock 尚未解除** | `reverse-utm-fixture-plan.md` §10.2 deadlock 釋義 |
| 5 | **主軌策略明確：等自然書評 / 心得文章** | `reverse-utm-fixture-plan.md` §10.4 主軌（推薦）|
| 6 | **`reverse-utm-fixture-plan.md` §8.1 已不建議近期為驗收硬建 fixture** | §8.1「現 session 或近期 session 為驗收建立 fixture」屬不建議列表 |

---

## §8 後續啟動條件與順序

### 8.1 啟動觸發路線

| 路線 | 性質 | 觸發條件 |
|------|------|---------|
| **主軌（推薦）** | 自然書評 / 心得文章自然引用 GitHub 站既有技術文章 | 未來作者撰寫之新書評（AI / 自媒體 / 工具書 / 教育類），若主題自然涉及「網站製作 / 部落格策略 / AI 工具」→ 在 `relatedLinks` 自然引用 GitHub 技術文 |
| **副軌 A** | user 主動決定寫 Blogger + GitHub 雙站管理心得 | user 自決時機；題目範例：「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」/「Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡」/「為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結」（per `reverse-utm-fixture-plan.md` §10.4 副軌 A）|
| **副軌 B** | 未來新教具 / 親子素材文章自然涉及網站製作 / 教學素材發布平台 | 視具體文章主題契合度；不勉強 |

### 8.2 啟動順序（per `reverse-utm-fixture-plan.md` §10.5 Phase 1-6）

任一路線觸發後，按以下 6 phase 切分執行：

| Phase | 動作 | 依賴 |
|-------|------|------|
| **Phase 1** | content create：新增 `content/blogger/posts/{date}-{slug}.md` + `.publish.json`；frontmatter 含 `mode: full` + `relatedLinks` 含 GitHub cross-link；`validate:content` 0 warning | — |
| **Phase 2** | build verify：`npm run build:blogger`；驗 §5.1.1-5.1.4 全部 invariant | Phase 1 |
| **Phase 3** | commit + push：git add content + commit + push origin/main | Phase 2 |
| **Phase 4** | Blogger 後台 per-post HTML 重貼（依 `docs/20260524-blogger-repost-checklist.md` §2.2 備份 + §3 重貼）；回填 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` 至 `.publish.json` | Phase 3 |
| **Phase 5** | GA4 Realtime 驗收（依 `docs/20260524-ga4-reverse-utm-observation.md` §4.2 步驟）；user 用 Chrome 無痕 / GA Debug Mode 開啟 Blogger 重貼後文章 → 點擊 GitHub cross-link → 觀察 `page_view` + UTM | Phase 4 |
| **Phase 6** | verification report：新增 `docs/YYYYMMDD-reverse-utm-fixture-verification-report.md`；含 fixture metadata + GA4 觀察紀錄 + 驗收後處理決策 | Phase 5 |

### 8.3 SOP cross-references

啟動時建議讀取順序：

1. `docs/reverse-utm-fixture-plan.md` §10 readiness addendum（5/24 baseline）
2. 本文件 §3 / §4（5/25 baseline；確認 dormant 狀態未漂移）
3. `docs/reverse-utm-fixture-plan.md` §3 fixture 設計原則 → §4 fixture 類型 → §5 驗收條件 → §6 啟動條件
4. `docs/20260524-blogger-repost-checklist.md`（Phase 4 重貼 SOP）
5. `docs/20260524-ga4-reverse-utm-observation.md`（Phase 5 GA4 觀察 SOP）
6. `docs/reverse-utm-fixture-plan.md` §7 驗收後處理（Phase 6 之內容寫法）

---

## §9 本 phase 邊界保證

本 phase `20260525-am-8-reverse-utm-readiness-snapshot-doc-a` 嚴格遵守 docs-only 邊界：

| 項目 | 狀態 |
|------|------|
| 新增 `docs/20260525-reverse-utm-readiness-snapshot.md`（本檔） | ✅ 唯一允許之動作 |
| 建立 fixture（`content/blogger/posts/*.md` / `.publish.json` / `.fb.md`） | ❌ 無 |
| 修改 `docs/reverse-utm-fixture-plan.md`（含 §10 addendum） | ❌ 無 |
| 修改 `docs/blogger-to-github-reverse-utm-plan.md` | ❌ 無 |
| 修改 `docs/20260524-ga4-reverse-utm-observation.md` / `docs/20260524-blogger-repost-checklist.md` / `docs/20260524-blogger-github-publishing-runbook.md` | ❌ 無 |
| 修改 `docs/phase-1-user-operation-guide.md`（含 5/25 am-6 reverse UTM 段）| ❌ 無 |
| 修改 Blogger / GitHub content（`content/`） | ❌ 無 |
| 修改 README / docs index（`docs/README.md`） | ❌ 無 |
| 修改 `CLAUDE.md` | ❌ 無 |
| 修改 `src/` / templates / settings / build scripts | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`） | ❌ 無 |
| 執行 `npm install` / `npm run build*` / `npm run validate*` / `npm run dev` | ❌ 無 |
| 執行 git commit / push | ❌ 無（待 user 確認後另行決定） |
| 觸碰 Blogger 後台 | ❌ 無 |
| 觸碰 GA4 後台 | ❌ 無 |
| 啟動任何 fixture create / Phase 1-6 | ❌ 無 |

本文件落地後**不**改變任何 production state；屬純 readiness 紀錄工具。

---

## §10 Cross-links

### 10.1 Reverse UTM 三層 canonical 詳本

- `docs/reverse-utm-fixture-plan.md`（含 §0-§9 fixture 設計 SOP + §10 5/24 am-9b readiness addendum；canonical fixture entry）
- `docs/blogger-to-github-reverse-utm-plan.md`（原 plan §1-§12 + §0 status update）
- `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM 觀察 SOP）

### 10.2 5/24 docs trail 相關

- `docs/20260524-blogger-repost-checklist.md`（Blogger 後台手動重貼 SOP；Phase 4 entry）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）
- `docs/20260524-eod-report.md`（5/24 全日收尾；§9 deferred + §15 docs trail map）

### 10.3 5/25 docs trail（本日）

- `docs/20260525-pc-handoff-baseline.md`（NB→PC 接手 baseline；commit `65145a8`）
- `docs/20260525-phase1-usability-review.md`（Phase 1 usability review；commit `d13174f`；§3.4 GA4 + §5.2 痛點 #3 reverse UTM dormant）
- `docs/20260525-phase1-user-guide-drift-check.md`（user guide drift audit；commit `dc167a6`；D5 §7 GA4 rewrite 含 reverse UTM dormant 段）
- `docs/phase-1-user-operation-guide.md`（commit `d6a8922`；§7 已 sync reverse UTM dormant 狀態）
- 本文件（5/25 am-8；待 commit）

### 10.4 上層規範

- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-site UTM 規則；reverse 方向 source landed but dormant）
- `docs/blogger-listener-strategy.md` §5.1（短期推薦方案 D — reverse UTM；Blogger listener 短期不做）

### 10.5 GA4 spec / governance

- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；source landed pm-24a/b/c；dormant）
- `docs/ga4-parameter-naming-registry.md` §4.2（reverse UTM 命名規格）
- `docs/click-tracking-governance.md` §4 row 3（reverse UTM 規格）/ §10 順序 5（Phase 2-d）

---

（本文件結束）
