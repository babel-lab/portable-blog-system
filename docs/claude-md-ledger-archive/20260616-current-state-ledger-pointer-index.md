# 20260616 current-state ledger pointer index

> Phase: `20260616-night-claude-md-ledger-archive-landing-a`
> Date: 2026-06-16 22:54
> Type: archive landing — current state snapshot + 歷史 ledger pointer 索引；docs-only landing；本檔**不**取代 `CLAUDE.md` 本體規範段（§1–§2、§4–§30 仍為 source of truth）。

> Role: 未來 `CLAUDE.md` compression（next phase）執行時，本檔將被 CLAUDE.md 之 §3 段以 pointer 形式引用，作為「當前快照 + 歷史索引」之單一來源。本檔自身為 docs-only，不改 source。

---

## 1. Source baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `cd33a10a4aefac9995621081e67854ebcf3c677a` |
| short HEAD | `cd33a10` |
| latest commit subject | `docs(claude): plan size warning compression` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |

Recent 5 commits（newest first）：

```
cd33a10 docs(claude): plan size warning compression
36fffe3 docs(blog): checkpoint phase1 mainline readiness
2de35e9 docs(admin): checkpoint admin stage progress
3628fcb docs(admin): record detail panel browser pass
df0c02f docs(admin): accept detail panel collapsible sections
```

---

## 2. CLAUDE.md size finding 摘要

per `docs/20260616-night-claude-md-size-warning-compression-preanalysis.md` §C：

| 計量 | 值 |
| --- | --- |
| bytes（`wc -c`） | 284,431 |
| chars（`wc -m`） | 227,910 |
| lines（`wc -l`） | 1,624 |
| Claude Code 警告閾值 | 40,000 chars |
| 目前 vs 閾值 | **5.7×** |
| §3 ledger 段（行 198–320） | ~197k chars / **69.2%** |
| 單一巨型行（line 293 Blogger AdSense 戰史） | **113,958 chars / 41.7%** |
| 規範主體（§1–§2、§4–§30 剝除 ledger） | ~31k chars（已落 ≤40k ideal） |

→ 主要 bloat = §3 內巨型 ledger；規範本身無問題。

---

## 3. Must-preserve current operating rules

未來 compression phase **不可移除**之 `CLAUDE.md` 章節（per preanalysis §D；皆為「規範 / 規則」性質，與歷史 ledger 不同）：

| 章節 | 角色 | CLAUDE.md 行號（baseline cd33a10） |
| --- | --- | --- |
| §1 系統目的（10 條核心理念） | 規範 | L8– |
| §2 兩平台定位（Blogger / GitHub Pages） | 規範 | L29– |
| §3.1 文章資料 frontmatter 範例 | 規範 | L131– |
| §3.2 設定檔清單 | 規範 | L173– |
| §4 技術限制（必用 / 禁用） | 規範 | L321– |
| §5 開發方向 + §6 分階段計畫（Phase 0–8） | 規範 | L357– / L365– |
| §7 系統分類編號（A–Z） | 規範 | L775– |
| §8 建議資料夾結構 | 規範 | L810– |
| §9 CSS / class 命名規則（`lab-` prefix / BEM / Flexbox 優先） | 規範 | L835– |
| §10 Blogger Design Token 匯出 | 規範 | L923– |
| §11 文章類型（`contentKind`） | 規範 | L953– |
| §12 書評文章規則（book / affiliate） | 規範 | L975– |
| §13 下載文章規則（`download`） | 規範 | L1021– |
| §14 標籤管理規則 | 規範 | L1039– |
| §15 分類管理規則 | 規範 | L1065– |
| §16 連結處理規則（外連 / 聯盟 / 站內 / 跨站 UTM / relatedLinks） | 規範 | L1080– |
| §17 文章頁基本版型 | 規範 | L1179– |
| §18 首頁 / 目錄頁規則 | 規範 | L1225– |
| §19 Design System 頁規則 | 規範 | L1249– |
| §20 JavaScript 互動功能 | 規範 | L1301– |
| §21 SEO 規則 | 規範 | L1325– |
| §22 圖片與素材管理 | 規範 | L1355– |
| §23 發布狀態規則 | 規範 | L1408– |
| §24 Blogger 發布 URL 回填 | 規範 | L1439– |
| §25 備份與搬家規則 | 規範 | L1466– |
| §26 package.json 指令 | 規範 | L1484– |
| §27 Claude Code 修改規則（每次回報格式 + 不得自動執行清單） | 規範 | L1511– |
| §28 第一版 MVP 必做清單（17 項） | 規範 | L1547– |
| §29 第一版不做清單（永禁） | 規範 | L1573– |
| §30 專案最終樣貌 | 規範 | L1594– |

→ 上述章節未來 compression phase **僅允許 cosmetic touch（如行尾空白、heading 排版）**，不得改變規範內容。

---

## 4. Must-preserve red lines

未來 compression phase 須完整保留之**紅線**（散落於 §16 / registry landing point / ledger 內，未來壓縮須集中保留）：

### 4.1 AdSense / secret 紅線

- real AdSense `client id` / `slot id` **只**存於 `content/settings/ads.config.json`
- 不得寫入 `docs/` / `CLAUDE.md` / `src/` / `views/` / `tests/` / `package.json` / 任何 frontmatter / 任何 ledger
- 本 archive 本身亦不含 real id 字面值

### 4.2 Commerce registry 紅線

- 不得含 affiliate dashboard credentials（email / password / OAuth client secret / API key）
- 不得含 access token / bearer token / refresh token / session id / Authorization header
- 不得含 commission / payout / clickCount 等 dashboard 統計
- 不得含帳號 email / 結算密碼 / 私人 Drive folder ID
- 不用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`；所有 key 由作者明示填寫
- 禁止為 fixture 修改 production `affiliate-networks.json`

### 4.3 Download registry 紅線

- 不得含 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
- 不得含 access token / API key / OAuth secret / 帳號 email / private permission / 私人 Drive folder ID
- Google Forms responses **stay in Google Forms / Sheets**；不進 repo

### 4.4 Dormant / blocked

- Reverse UTM Blogger→GitHub deploy = **dormant**（pm-26 deploy gate BLOCKED；source landed but un-deployed）
- Admin Apply / middleware write / admin-write-cli = **dormant**
- FB sidecar 真實寫入 = **dormant**（須 user 勾選 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 preflight checklist）
- FB Graph API / Blogger API / Google Drive API / 自動社群發文 = **第一版永禁**（CLAUDE.md §29）
- 真正後台登入 / 視覺化編輯器 / 留言 / View 數 / 讚數 / 會員 / 資料庫後端 = **第一版永禁**（CLAUDE.md §29）

### 4.5 Git / source 紅線

- 未經 user 要求不得自動 `git push` / `git push --force`
- 未經 user 要求不得 `git rebase` / `git amend`（永禁對 main 線性堆疊破壞）
- 未經 user 要求不得刪除大量檔案 / 重構整個專案 / 改變技術選型
- 不得加入 React / Vue / Astro / Next.js / Nuxt / Tailwind
- 不得加入後端資料庫 / 登入後台 / Blogger API / Drive API
- 跳過 hooks（`--no-verify`）/ bypass signing 永禁（除非 user explicit 同意）

---

## 5. BLOG Phase 1 current state pointer

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| Phase 1 final 宣告（2026-05-18） | ✅ final / completion snapshot landed | `docs/phase-1-completion-report.md` / `docs/phase-1-completion-checklist.md` |
| BLOG Phase 1 mainline readiness 盤點 | ✅ docs-only checkpoint landed | `docs/20260616-night-blog-phase1-mainline-readiness-and-next-action-map.md` |
| MVP 17 項必做 | ✅ 全達標 | `CLAUDE.md` §28 + `docs/phase-1-completion-checklist.md` §3 |
| 12 項永禁不做 | ✅ 全維持 | `CLAUDE.md` §29 + `docs/phase-1-completion-checklist.md` §4 |
| Phase 0–7 + 8-a–8-h + 9-b/c/e/f-c/f-g/g/g-g/h/i/j 主軸 | ✅ 全 landed | `docs/phase-*-completion-report.md` 各檔 |
| Article block parity（Blogger ↔ GitHub）6/6 | ✅ | `docs/phase-9h-completion-report.md` |
| we-media-myself2 端對端 PASS | ✅ | `docs/phase-1-completion-report.md` §3.4 |
| relatedLinks / Hashtag live activation | ✅ | Phase 9-g / Phase 9-z-d |
| dist/sitemap.xml + dist/robots.txt | ✅ | Phase 9-g-g-c（2026-05-19） |

→ **Phase 1 內已無「尚未完成」項目**；下列屬 post-Phase-1 強化，不阻擋 Phase 1。

---

## 6. ADMIN idle freeze pointer

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| ADMIN stage progress checkpoint | ✅ docs-only checkpoint landed；idle freeze | `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md` |
| ADMIN dev-mode-only 性質 | ✅ 不進 prod build / 不進 dist / 不 deploy / noindex | per checkpoint §C |
| Posts index（read-only）+ per-post detail panel + governance / validation report consume + R1 collapsible sections | ✅ | per checkpoint §C / §D |
| Posts table `<td>` 結構閉合（7/7） | ✅ | `pm-11` `886e0c3` / `pm-12` `7dd4fe2` |
| Validation reporter（`report:validation` + `check:validation-report` 14/0 + `check:admin-validation-consume` 12/0） | ✅ landed | per checkpoint §C.7 |
| ADMIN R2 / R3 / R4 / R5 / SEO 收合 / write path / count badge / filter chip / per-post prescription | ❌ deferred；須獨立 phase + user approval | per checkpoint §E / §H |

→ ADMIN 線進入 **idle freeze**；後續 session 不應主動推進 ADMIN R2–R5 / write path。

---

## 7. Blogger / GitHub Pages / AdSense / GA4 current state pointer

### 7.1 Blogger publishing + AdSense

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| Blogger 手動發布流程 | ✅ runbook landed | `docs/20260524-blogger-github-publishing-runbook.md` + `docs/blogger-export.md` |
| Blogger AdSense `articleAd6` / `beforeRelatedLinks` LIVE | ✅ 6 篇 live PASS | `we-media-myself2` / `github-pages-blog-planning` / `daily-reading-habit-notes` / `reading-notes-three-questions` / `after-work-writing-time-blocking` / `blog-as-personal-knowledge-base` |
| Guard `check:blogger-adsense-output` | ✅ 85/0（1 settings invariant + 14×6 target） | `src/scripts/check-blogger-adsense-output.js` |
| Blogger AdSense Batch 1 minimum completion | ✅ READY（per pm-7 completion record） | `docs/20260612-blogger-adsense-batch-1-completion-record.md` |
| Blogger AdSense Batch 2 P2 `ai-tools-simplify-daily-workflow` content landed | ✅ landed；live repost 🔴 BLOCKED | `docs/20260612-blogger-p2-ai-workflow-content-landing-record.md` + `docs/20260612-blogger-p2-ai-workflow-manual-repost-packet.md` |
| Blogger AdSense Batch 2 P3 `blog-restart-steady-rhythm-notes` | docs draft only；未落 content | `docs/20260612-blogger-p3-steady-rhythm-article-draft.md` |
| 6-post monitoring record | ✅ landed | `docs/20260612-blogger-adsense-six-live-posts-monitoring-record.md` |

### 7.2 GitHub Pages + AdSense + sitemap

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| GitHub Pages AdSense N9e article ads LIVE | ✅（2026-06-11；deploy `2acb5a5→c15e514`） | `docs/20260611-adsense-n9e-*` + `docs/20260611-adsense-n9-closure-checkpoint.md` |
| Resolver + 14 v1 anchor 插入點 | ✅ | `src/scripts/resolve-adsense-blocks.js` + `src/views/pages/post-detail.ejs` + `docs/20260611-n8-anchor-wiring-acceptance-and-n9-readiness.md` |
| Guard `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` | ✅ 34/0 / 13/0 / 14/0 | `src/scripts/check-adsense-*.js` |
| GitHub deploy runbook | ✅ | `docs/github-deploy.md` §4 + §5.4 |
| Sitemap / robots / JSON-LD（BlogPosting + WebSite + isPartOf + mentions + Book mainEntity） | ✅ | Phase 9-g-g-c / 9-j |
| Custom domain | ⏸ 未啟用；前置 docs 已備 | `docs/custom-domain-root-files-strategy.md` |

### 7.3 GA4

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| GA4 production live | ✅ measurementId `G-C77SMPF8VD`（2026-05-21 起） | `docs/ga4-enable-preflight.md` |
| GA4 P1 article_bottom_nav custom dimensions report-verified | ✅（2026-06-15 17:35） | `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md` |
| 紅線 | 篩文章底部導覽必須 `event_name=click_other_link` **加** `click_area=article_bottom_nav` 雙條件，不可單看 `click_other_link` | per GA4 P1 record §2 |
| GA4 P2 / P3 dimension expansion | ⏸ 候選 phase；未啟動 | per BLOG phase1 readiness §K.4 |

---

## 8. Commerce / download / reverse UTM / FB sidecar current state pointer

### 8.1 Commerce links

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| Commerce links L1 seed | ✅ 10 active entries（全 `networkKey: books` / 通路王） | `docs/20260610-commerce-blogger-tongluwang-l1-seed-result.md` + `docs/20260610-commerce-l1-seed-acceptance-checkpoint.md` |
| Resolver `resolve-affiliate-links.js` + smoke `check-commerce-affiliate-resolver.js` | ✅ 23/0 | `src/scripts/resolve-affiliate-links.js` + `src/scripts/check-commerce-affiliate-resolver.js` |
| R3 we-media-myself2 url→ref migration | ✅ 2 筆 | `docs/20260610-commerce-we-media-myself2-ref-migration.md` |
| pm-12 Blogger `affiliate.blocks[]` renderer wiring + pm-13 we-media dual-block content | ✅ landed | `docs/20260610-affiliate-blocks-frontmatter-convention.md` + `docs/20260610-blogger-dual-block-content-model-preanalysis.md` |
| commerce L2 新 candidate | 🔴 BLOCKED；須 user-provided YAML + explicit approval | `docs/20260608-commerce-l1-seed-candidate-intake-template.md` |
| commerce C7 / C9 broader expansion | ❌ NOT implemented / Option D / no expansion | `docs/20260609-commerce-c9-label-override-safety-preanalysis.md` |
| validator C1–C6 / C8 / C4 / C9 content-ref rules | ✅ landed（warning-only） | `src/scripts/validate-content.js` |

### 8.2 Download

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| `download-assets.json` / `download-forms.json` | empty registry landing point | per CLAUDE.md §3 |
| Validator registry shape + R1–R5 + R5b rules | ✅ landed（warning-only） | `src/scripts/validate-content.js` |
| Production content migration（`download.fileUrl` → `assetRefs[]` / `formRef`） | ❌ deferred；production posts 未使用 | per CLAUDE.md §3 |
| Admin picker / renderer / landing page / Google Forms 串接 | ❌ deferred | per CLAUDE.md §3 |

### 8.3 Reverse UTM Blogger → GitHub

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| Source landed（pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`） | ✅ 2026-05-23 push origin/main | `docs/blogger-to-github-reverse-utm-plan.md` |
| Deploy verify | 🔴 BLOCKED；source live but dormant | `docs/reverse-utm-fixture-plan.md` §6 |
| Positive GitHub cross-link fixture | ❌ 未建立；pm-26 gate 前置條件 | `docs/20260526-reverse-utm-positive-fixture-scan-report.md` §7 |
| pm-26 deploy gate | 🔴 BLOCKED；待 fixture 建立 + Blogger 後台重貼 + GA4 Realtime 驗收 | `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` |

### 8.4 FB sidecar

| 主題 | 狀態 | docs pointer |
| --- | --- | --- |
| `.fb.md` schema + sidecar load + normalize | ✅ landed | `docs/fb-sidecar-schema.md` + Phase 8-d-4-b / 8-f-7-b / 8-g-19-c / 9-i-d-b |
| `build:promotion` + UTM 集中管理 | ✅ | `docs/promotion-export.md` + `content/settings/promotion.config.json` |
| ADMIN read-only display + dry-run editor | ✅ landed（Apply 永遠 disabled） | `docs/admin-2b1-completion-report.md` |
| FB sidecar 真實寫入 | ⏸ dormant；待 user 勾選 8 項 preflight | `docs/fb-sidecar-write-preflight-decision.md` §7 + `docs/fb-sidecar-write-safety.md` |
| FB Graph API / 自動社群發文 | ❌ 永禁第一版 | CLAUDE.md §29 |

---

## 9. Validation baseline pointer

baseline cd33a10 時點（carry-forward；未於本 docs-only phase 重跑）：

| 指令 | 結果 |
| --- | --- |
| `npm run validate:content` | **0 errors / 94 warnings / 84 issue-posts**（normal） |
| `node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` | **0 errors / 101 warnings / 85 issue-posts**（overlay） |
| `npm run check:adsense-resolver` | 34/0 |
| `npm run check:adsense-article-block` | 13/0 |
| `npm run check:adsense-anchor-wiring` | 14/0 |
| `npm run check:blogger-adsense-output` | 85/0（6 targets） |
| `npm run check-commerce-affiliate-resolver` | 23/0 |
| `npm run check:admin-governance-aggregation` | 16/0 |
| `npm run report:validation` | 0/94/84 |
| `npm run check:validation-report` | 14/0 |
| `npm run check:admin-validation-consume` | 12/0 |

說明：
- production-post warnings = 0（94 / 101 全來自 `content/validation-fixtures/` fixture posts）
- baseline 隨 fixture / ready post 自然漂移屬正常；regression detection 以本 snapshot 為對照
- ADMIN smoke 與 dev render 數值（Posts index / Validation warnings ×11 / Governance signals ×12 / Aggregation summary ×11 / `<details>` 46/46/46）= ADMIN dev-mode-only；不在 build:blogger 路徑

---

## 10. 不應重做的 completed phase pointer

未來 session **不應重新「實作 / 重做 / 重新規劃」**之已完成項目（per BLOG phase1 readiness §M + ADMIN checkpoint §J）：

### 10.1 BLOG Phase 1 final 範圍

| 項目 | docs pointer |
| --- | --- |
| CLAUDE.md §28 17 條 MVP 必做 | `docs/phase-1-completion-checklist.md` §3 |
| Phase 0 ~ 9 主軸全 ✅ | `docs/phase-1-completion-report.md` §5 / §7 |
| 6/6 article block parity | `docs/phase-9h-completion-report.md` §4 |
| Phase 8-h legacy 退場 15/15 | `docs/phase-8h-completion-report.md` |
| Phase 9-g relatedLinks / otherLinks 全套 | `docs/phase-9g-completion-report.md` |
| Phase 9-g-g JSON-LD isPartOf + mentions | `docs/phase-9g-g-completion-report.md` |
| Phase 9-f-g Book mainEntity JSON-LD | `docs/phase-9f-g-completion-report.md` |
| Phase 9-i known blockers 3/3 | `docs/phase-9h-known-blockers.md` §7.1 |
| Phase 9-j JSON-LD landing verification | `docs/phase-9j-jsonld-landing-verification.md` |
| we-media-myself2 端對端 PASS | `docs/phase-1-completion-report.md` §3.4 |
| dist/sitemap.xml + dist/robots.txt 補檔（Phase 9-g-g-c） | `docs/phase-1-completion-report.md` §8.9 |

### 10.2 Phase 1 final 後 post-Phase-1 已完成項目

| 項目 | 大致時間 | docs pointer |
| --- | --- | --- |
| Reverse UTM Blogger→GitHub source landing（pm-24a/b/c） | 2026-05-23 | `docs/blogger-to-github-reverse-utm-plan.md` |
| AdSense N7 resolver + N8 article-block + anchor wiring + 14 v1 anchors + N8 default blocks | 2026-06-11 | `docs/20260611-n8-anchor-wiring-acceptance-and-n9-readiness.md` |
| AdSense N9e GitHub Pages article ads LIVE + deploy | 2026-06-11 | `docs/20260611-adsense-n9e-*` |
| AdSense N9f resolver guard update | 2026-06-11 | per CLAUDE.md ledger |
| Blogger AdSense Phase B/C/D（dual-block；we-media-myself2 single-post live） | 2026-06-11 | `docs/20260611-blogger-adsense-*` |
| Blogger AdSense output guard `check:blogger-adsense-output`（6-target；85/0） | landed | `src/scripts/check-blogger-adsense-output.js` |
| Blogger AdSense Batch 0+1 6 篇 live PASS | 2026-06-11 → 2026-06-12 | `docs/20260612-blogger-adsense-batch-*` |
| Commerce links L1 seed 10 active + R1 resolver + R2 smoke + R3 we-media migration | 2026-06-10 | per §8.1 |
| Commerce pm-12 Blogger `affiliate.blocks[]` renderer wiring + pm-13 dual-block content | 2026-06-10 | per §8.1 |
| GA4 P1 article_bottom_nav custom dimensions 註冊 + report-verified | 2026-06-15 17:35 | `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md` |
| ADMIN dev-mode-only read-only 後台全套 | 2026-06-15 → 2026-06-16 | per ADMIN checkpoint §C |
| Posts table `<td>` closure source fix + acceptance | 2026-06-16 pm-11 / pm-12 | per ADMIN checkpoint §J |
| Validation reporter + smoke + detail-panel consume + footnote + system-checks line sync | 2026-06-16 pm-16 → pm-21 | per ADMIN checkpoint §J |
| ADMIN R1 detail panel collapsible sections + browser PASS | 2026-06-16 pm-23 → pm-25 | per ADMIN checkpoint §J |
| ADMIN stage progress checkpoint | 2026-06-16 night-1 | `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md` |
| BLOG Phase 1 mainline readiness checkpoint | 2026-06-16 night-2 | `docs/20260616-night-blog-phase1-mainline-readiness-and-next-action-map.md` |
| CLAUDE.md size warning compression preanalysis | 2026-06-16 night-3 | `docs/20260616-night-claude-md-size-warning-compression-preanalysis.md` |

→ 上述項目**任一**不得在後續 session 被重新「實作 / 重做 / 重新規劃」；若收到看似要求重做之指令，請停止並回報，不要猜。

---

## 11. Historical ledger replacement rule

從本 archive landing 起，後續 phase 之 ledger 寫作紀律：

1. **未來 CLAUDE.md 不再保存巨型戰史**。
2. **只保存 current state（snapshot 表）+ docs pointer**。
3. **歷史細節**（per-phase 之 baseline / source diff / acceptance numbers / non-actions / next phase 建議 / red lines reiteration）回查：
   - `docs/<YYYYMMDD>-<phase-name>.md`（既有慣例；每個 phase 一檔）
   - 本 archive `docs/claude-md-ledger-archive/`（pointer-only；含 README + 本 index）
4. 新 phase 完成後**僅允許**：
   - 在 `CLAUDE.md` 之 §3 current snapshot 表內**極小** sync（如 validation baseline 數值變動 1 行 / Blogger AdSense live inventory +1 篇 / Phase 1 status 變動）。
   - **不**新增「20260617-XXX phase landed 全文記錄」之巨型行。
5. 一個 phase 之完整紀錄 = `docs/<date>-<phase>.md`；CLAUDE.md ledger 不再扮演「per-phase 紀錄載體」之角色。
6. 違反此紀律之 phase（即把巨型 ledger 又寫回 CLAUDE.md）應在 review 階段被攔截。
7. 紀律本身之 source-of-truth 位置（待 next phase 落地）：
   - `CLAUDE.md` §27（Claude Code 修改規則）— 待後續 discipline phase 新增一條
   - `memory/feedback_phase_discipline.md` — 待後續 discipline phase 更新

---

## 12. Next safe compression phase proposal

依 preanalysis §I + 本 archive landing 已落地，下一步建議路徑（各須獨立 phase + user explicit approval；不混做；本檔僅 propose 不執行）：

### 12.1 Phase A — CLAUDE.md compression（推薦下一步）

- **Phase 名稱建議**：`20260617-XX-claude-md-current-state-compression-a`
- **Type**：NOT docs-only（會修改 `CLAUDE.md` 本體；但**不**改 source / settings / content）
- **Scope**：
  - 把 `CLAUDE.md` 行 198–320 之巨型 ledger 段替換為 ~30 行：「當前 system snapshot 表 + 歷史 ledger 索引 pointer」
  - 索引直接引用本檔（`docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md`）與既有 `docs/<date>-<phase>.md` 檔
  - **不**動 §1–§2、§4–§30（規範主體一律保留）
- **Acceptance**：
  - `wc -m CLAUDE.md` ≤ 40,000 chars
  - 透過 grep 確認紅線政策（real id / token / respondent / dormant / pm-26 BLOCKED）/ Phase 1 MVP / 17 必做 / 12 不做 / `lab-` prefix / `See also:` 連結等關鍵字仍存在
  - 透過 ledger 索引可從 CLAUDE.md 跳到任一歷史 phase doc（pointer 正確）
  - working tree clean / ahead-behind 0/0 / 唯一 commit 為單檔 CLAUDE.md 重寫 + 本 archive 索引若需微更新
- **紅線**：不動 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / lockfile / `dist/` / `gh-pages` / `.cache/` / build / deploy / Blogger / GA4 / AdSense 後台

### 12.2 Phase B — phase discipline 更新（docs-only）

- **Phase 名稱建議**：`20260617-XX-phase-discipline-no-ledger-writeback-a`
- **Type**：docs-only
- **Scope**：
  - `CLAUDE.md` §27 新增一條：「新 phase 完成後 ledger 寫到 `docs/<date>-<phase>.md`，**不**回寫 CLAUDE.md `### 當前 baseline` 段」
  - `memory/feedback_phase_discipline.md` 同步更新
- **紅線**：純規則 update；不動其他內容

### 12.3 Phase C — archive expansion（docs-only；可選；非必要）

- **Phase 名稱建議**：`20260617-XX-claude-md-ledger-archive-expansion-a`
- **Type**：docs-only
- **Scope**：把 `CLAUDE.md` 行 198–320 之巨型 ledger 原文拆 copy 進本 archive 之新檔（例如 `2026-06-15-admin-ia-resume.md` / `2026-06-16-admin-governance-line.md` / `blogger-adsense-n7-n9-phase-d-batch-history.md`），作為「歷史原文 backup」
- 適用情境：若 user 偏好把巨型 ledger 原文也搬出 CLAUDE.md 但暫不改 CLAUDE.md 本體
- **非本路線必要**；推薦路線是 Phase A（compression）直接替換為 pointer

### 12.4 紅線（三 phase 共用）

- archive landing（本 phase）/ compression（A）/ discipline 更新（B）/ archive expansion（C）一律獨立、不混做
- compression phase A 須以本 archive landing 完成作為前置
- 任何 phase 不得碰 source / settings / build / deploy / Blogger / GA4 / AdSense / 任何 content frontmatter mutation
- 不對 Phase 1 final 宣告做任何降級或重新封存
- 不啟動 reverse UTM deploy / pm-26 deploy gate / Admin write path / FB sidecar 真實寫入

---

## 13. Non-actions（本 phase 明確不做）

| 項目 | 狀態 |
| --- | --- |
| 修改 `CLAUDE.md`（含 ledger / heading / snapshot / 任何行） | ❌ 未做 |
| 壓縮 / 重排 / 重寫 `CLAUDE.md` | ❌ 未做 |
| 刪除任何 ledger 內容（CLAUDE.md 行 198–320 維持原文） | ❌ 未做 |
| 搬移任何 ledger 原文進 archive 子檔（本 phase 僅建立 landing） | ❌ 未做 |
| 搬動 / 改名既有 `docs/` 檔案 | ❌ 未做 |
| 修改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / lockfile / `dist/` / `gh-pages` / `.cache/` | ❌ 未做 |
| `npm install` / build / deploy / push gh-pages / Blogger repost / 開 Blogger / 開 AdSense / 改 GA4 後台 | ❌ 未做 |
| 重跑 validate / check guard | ❌ 未做（baseline carry-forward） |
| 啟動 BLOG / ADMIN / Blogger / GA4 / AdSense / GitHub Pages / Reverse UTM / FB sidecar 任何新工作 | ❌ 未做 |
| amend / rebase / reset / force push / cherry-pick / merge | ❌ 未做 |
| 動 `MEMORY.md` / 任何 user memory 檔 | ❌ 未做 |
| 對 Phase 1 final 宣告做降級或重新封存 | ❌ 未做 |
| 啟動 reverse UTM deploy / pm-26 deploy gate / Admin write path / FB sidecar 真實寫入 | ❌ 未做 |
| 執行 Phase A（compression）/ Phase B（discipline）/ Phase C（expansion） | ❌ 未做（僅 propose） |

唯一 mutation = `docs/claude-md-ledger-archive/README.md` + 本檔 `20260616-current-state-ledger-pointer-index.md`。

---

real AdSense client / slot id 一律不寫入本檔；本檔內亦無 commerce token / credential / respondent data / 任何 secret 字面值。本檔為純 pointer + current state snapshot。

（本文件結束）
