# 20260522 Phase 1 Done Criteria

本文件為 BLOG 系統 **Phase 1 之「完成條件 / 驗收口徑 / 邊界定義」**；屬 docs-only；本批 phase `20260522-day-2-b` **不**修改任何 source / template / settings / build / deploy。

文件採 **cross-reference 模式**：與既有 README / roadmap / phase report / baseline confirmation 有重疊時，**指向**既有文件而非重寫歷史細節；本文件不取代既有文件。

---

## 1. Purpose

### 1.1 本文件之用途

- 定義 **Phase 1 何時可視為完成** 之單一驗收口徑（acceptance criteria framework）
- 提供 user / future maintainer 一份**簡潔可判斷**之 Done / Not Done checklist
- 避免「Phase 1 何時算完」之認知模糊

### 1.2 本文件**不是**

- ❌ **不是 EOD report**（每日紀錄屬 `docs/20260522-eod-report.md` 等 daily log）
- ❌ **不是 roadmap**（路線計畫屬 `docs/phase-2-candidate-roadmap.md` / `docs/future-roadmap.md`）
- ❌ **不是 Phase 1 completion report**（落地紀錄屬 `docs/phase-1-completion-report.md`；本文件僅 echo 其驗收結論）
- ❌ **不是 baseline confirmation**（基礎可運行宣告屬 `docs/20260522-phase-1-baseline-confirmation.md`；本文件比其更聚焦於「criteria 框架」）

### 1.3 本文件之單一定位

**Phase 1 驗收口徑** — 提供清晰可勾選之 8 大 criteria area + 7 個 non-goals + 6 個 residual risks，讓任何人能快速判斷 Phase 1 是否封閉。

---

## 2. Phase 1 Scope Definition

### 2.1 Phase 1 是什麼

Phase 1 是一條**最小可用之 publish pipeline**：

```
本機 source（Markdown + frontmatter + JSON settings）
   ↓
Blogger 貼文輸出（手動貼文 + copy-helper + publish-checklist）
   ↓
GitHub Pages 靜態文章（vite build → dist → gh-pages deploy）
   ↓
GA4 production 基礎追蹤（page_view + UTM 來源辨識）
   ↓
文件可驗收（docs/ + checklists）
```

### 2.2 Phase 1 **不是**

- ❌ **不是**完整 CMS（per `CLAUDE.md` §29）
- ❌ **不是** Blogger API 自動發文（屬 Z 類；per `CLAUDE.md` §29）
- ❌ **不是**完整 Admin write flow（仍 read-only / dry-run；per `docs/admin-1-completion-report.md`）
- ❌ **不是** custom domain 已啟用（per `docs/custom-domain-root-files-strategy.md`）
- ❌ **不是** Google AdSense approval 已通過（per `docs/ad-affiliate-schema-proposal.md` §6.1）
- ❌ **不是** Phase 2 SEO automation（屬未來；per `docs/seo-sitemap-split-pre-analysis.md` 結論「當前不建議」）

---

## 3. Phase 1 Done Criteria

8 個 criteria area；每 area 含 **acceptance check** + **cross-reference**。

### 3.1 Blogger output

| Criterion | Done?（per current state） | Cross-ref |
|---|---|---|
| `dist-blogger/posts/{slug}/{post.html, copy-helper.txt, publish-checklist.txt, meta.json}` 四檔皆產出 | ✅ | `docs/phase-1-completion-report.md` §3.3 / §5.3 |
| 6 個 conditional article blocks（affiliate / download / book photo / hashtag / relatedLinks / otherLinks）可條件式 render | ✅ | `docs/phase-1-completion-report.md` §7.1 |
| copy-helper [13] block 完整輸出 | ✅ | `docs/phase-1-completion-report.md` §5.6 |
| publish-checklist 含 book-review / magazine + relatedLinks / otherLinks 內容檢查區段 | ✅ | `docs/phase-1-completion-report.md` §5.7 |
| 至少 1 篇 ready post 通過 end-to-end build × 5 pipeline | ✅（`we-media-myself2`）| `docs/phase-1-completion-report.md` §3.4 |

### 3.2 GitHub Pages output

| Criterion | Done? | Cross-ref |
|---|---|---|
| `dist/index.html` + `dist/posts/{slug}/index.html` + `categories/` + `tags/` + `design-system/` + `404.html` 皆產出 | ✅ | `docs/phase-1-completion-report.md` §5.4 |
| Cross-source mirror（Blogger source post 同步至 GitHub dist）| ✅ | `docs/phase-1-completion-report.md` §5.4 |
| basePath dev/build mode 分流 | ✅ | `docs/20260521-end-of-day-report.md` §4.3 |
| Vite build 成功；無 error / warning | ✅ | `docs/20260521-end-of-day-report.md` §4.4 |

### 3.3 sitemap / routing / 404

| Criterion | Done? | Cross-ref |
|---|---|---|
| `dist/sitemap.xml` 含全部 ready posts | ✅（14 entries）| `docs/phase-1-completion-report.md` §3.3 / §8.9 |
| sitemap 過濾 noindex（per SEO-2-z）| ✅ | `docs/seo-indexing-rules.md` |
| `dist/robots.txt` 含 Disallow + Sitemap | ✅ | `docs/phase-1-completion-report.md` §5.5 |
| 404 頁面可用（dev: vite mpa default；prod: GitHub Pages 自動 fallback）| ✅ | `README.md` §可用頁面 |

### 3.4 GA4 production tracking

| Criterion | Done? | Cross-ref |
|---|---|---|
| GA4 measurementId 已設定 + enabled=true | ✅（`G-C77SMPF8VD`）| `content/settings/ga4.config.json` |
| 4-AND gating（ga4 + enabled + measurementId + isProdBuild）| ✅ | `docs/20260521-end-of-day-report.md` §11 / §15 |
| Production deploy 後 Realtime 驗收通過 | ✅（5/21 pm-46）| `docs/20260521-end-of-day-report.md` §16 |
| Cross-link UTM（GitHub → Blogger）已實作 | ✅ | `src/scripts/ga4-url-builder.js` `applyCrossSiteUtm` |
| Cross-link UTM（Blogger → GitHub）已實作 | ❌（屬 Phase 2 future；per `CLAUDE.md` §16.4）| `docs/20260522-pm-phase-2-batch-plan.md` §10 |

### 3.5 affiliate / ad block management

| Criterion | Done? | Cross-ref |
|---|---|---|
| `content/settings/affiliate-networks.json` 含 provider entries | ✅（通路王 / 聯盟網）| 對應 file |
| `content/settings/ads.config.json` 結構就位（AdSense slots） | ✅（schema ready；enabled=false）| 對應 file |
| Affiliate-box conditional render（top / bottom）| ✅（兩端 partial 皆有）| `docs/phase-1-completion-report.md` §5.8 |
| Unified ad / affiliate schema proposal 已 docs | ✅ | `docs/ad-affiliate-schema-proposal.md` |
| Click event 對接（`click_affiliate_cta`）| ❌（屬 Phase 2 first source batch）| `docs/20260522-pm-phase-2-batch-plan.md` §5 |

### 3.6 Admin read-only / preview safety

| Criterion | Done? | Cross-ref |
|---|---|---|
| Admin page exists（`/admin/`）| ✅ | `src/views/admin/index.ejs` |
| Read-only banner + robots noindex | ✅ | `docs/admin-1-completion-report.md` |
| dev-mode-only（prod build 跳過）| ✅ | `docs/admin-1-completion-report.md` |
| 無 write path（無 form submit / fetch / fs.write）| ✅ | `docs/fb-sidecar-write-preflight-decision.md` |
| Dry-run editor（preview only）| ✅ | `docs/admin-2b1-completion-report.md` |

### 3.7 metadata / FB sidecar visibility

| Criterion | Done? | Cross-ref |
|---|---|---|
| `.fb.md` sidecar schema 定義完整 | ✅ | `docs/fb-sidecar-schema.md` |
| Admin detail panel 顯示 fbPostUrl / fbPostedAt / fbPostId / fbCampaign | ✅（line 397-409）| `src/views/admin/index.ejs` |
| fbPublished completeness rule（Admin loader）| ✅ | `docs/20260521-end-of-day-report.md` §4.2 / §14.4 |
| validate-level `fb-post-url-missing` rule | ✅ | `docs/20260521-end-of-day-report.md` §14.5 |
| publishedAt 顯示於 Admin | ✅ | `src/views/admin/index.ejs` detail panel |

### 3.8 docs / roadmap alignment

| Criterion | Done? | Cross-ref |
|---|---|---|
| `README.md` 含主要 npm 指令 + 第一階段 capabilities | ✅ | `README.md` |
| `docs/README.md` 為入口；指向各 schema / phase docs | ✅ | `docs/README.md` |
| `CLAUDE.md` §28 17 條 MVP 必做清單對照 ✅ | ✅ | `docs/phase-1-completion-report.md` §5 / `docs/phase-1-completion-checklist.md` §3 |
| Phase 1 completion report 已 final | ✅ | `docs/phase-1-completion-report.md`（Phase 9-z-d）|
| Phase 1 baseline confirmation 已落地（5/22 正式宣告）| ✅ | `docs/20260522-phase-1-baseline-confirmation.md` |

---

## 4. Current Status Snapshot

### 4.1 已達成 criteria

per `docs/20260522-day-1-readonly-a-report.md` §2 + `docs/20260522-phase-1-baseline-confirmation.md` §3：

- §3.1 Blogger output — **全達成**
- §3.2 GitHub Pages output — **全達成**
- §3.3 sitemap / routing / 404 — **全達成**
- §3.4 GA4 production tracking — **5/6 達成**（反向 UTM 屬 Phase 2）
- §3.5 affiliate / ad block management — **4/5 達成**（click event 對接屬 Phase 2）
- §3.6 Admin read-only / preview safety — **全達成**
- §3.7 metadata / FB sidecar visibility — **全達成**
- §3.8 docs / roadmap alignment — **全達成**

### 4.2 部分達成 criteria

| Area | 部分達成內容 | 屬性 |
|---|---|---|
| §3.4 GA4 tracking | Blogger → GitHub 反向 UTM 未實作 | 🟡 Phase 2 future |
| §3.5 affiliate block | `click_affiliate_cta` 等 click event 未對接至 EJS template | 🟡 Phase 2（per pm-phase-2-batch-plan §5）|
| hashtag interaction | hashtag 為 `<span>` 而非 `<a>`；無 click target | 🟡 Phase 2（per pm-phase-2-batch-plan §8）|

### 4.3 尚未達成但可延後至 Phase 2

per `docs/20260522-phase-1-baseline-confirmation.md` §5 + §6：

- Custom domain migration
- Admin write surface
- AdSense enablement
- GA4 click listener attr 對接（src/views/...）
- EJS data-ga4-* attributes 實作
- Blogger listener strategy（A/B/C）
- Blogger → GitHub reverse UTM
- hashtag span → a 改造
- Phase 2 12 批 implementation 任一項

### 4.4 判定結論

✅ **Phase 1 已達 Done 條件**：8 area 之 acceptance check 皆 ✅ 或屬「部分達成但屬 Phase 2 future」；無 Phase 1 阻擋項。

---

## 5. Explicit Non-goals

以下項目**明確不在 Phase 1 範圍**；不得用作判定 Phase 1 未完成之依據：

| # | Non-goal | 理由 |
|---|---|---|
| 1 | **Custom domain** | 依賴 user 取得 domain / DNS provider；per `docs/custom-domain-root-files-strategy.md` |
| 2 | **Google AdSense approval** | 依賴 custom domain + HTTPS Enforce + AdSense 申請通過；per `docs/ad-affiliate-schema-proposal.md` §6.1 |
| 3 | **Blogger API auto publish** | 屬 Z 類；per `CLAUDE.md` §29 第一版不做清單 |
| 4 | **Full Admin write / save flow** | 依賴 user preflight checklist；per `docs/fb-sidecar-write-preflight-decision.md` §7 |
| 5 | **Full SEO automation**（如 sitemap multi-platform split / hreflang / News sitemap）| 屬未來；per `docs/seo-sitemap-split-pre-analysis.md` 結論「當前不建議實作」 |
| 6 | **React / server-side CMS** | 屬技術選型；per `CLAUDE.md` §4 第一版限制 |
| 7 | **Deploy repo rewrite** | 屬獨立 pipeline；per `docs/system-direction.md` §2 / `CLAUDE.md` §29 |

---

## 6. Phase 1 Residual Risks

雖然 Phase 1 已 done，仍存在以下 6 項風險；屬**已知 + 監測中**；不阻擋 Phase 1 封閉：

| # | Risk | 監測 / 對應建議 |
|---|---|---|
| 1 | **Admin 文章數成長後需要 filter / pagination / default recent N** | 當前 EJS 含 filter + show-all toggle；無 pagination；當前 < 10 ready post 風險低；待 ≥ 30 post 時觸發；per `docs/20260522-pm-phase-2-batch-plan.md` §4 未提；可後續評估 |
| 2 | **GA4 event naming 尚需統一**（CLAUDE.md §5 既有 9 個 vs governance doc 建議 `click_*` 統一前綴）| per `docs/click-tracking-governance.md` §9.2 list reconcile decision deferred；屬 Phase 2 governance decision |
| 3 | **affiliate top / bottom click tracking 尚需明確規格** | per `docs/click-tracking-governance.md` §7 + `docs/ad-affiliate-schema-proposal.md` §6 + §7；spec 已 docs；click event 對接屬 Phase 2 first source batch |
| 4 | **FB metadata sidecar 需要穩定回填流程** | 當前 fbPostUrl / fbPostedAt / fbPostId / fbCampaign 為手動填入；Admin dry-run editor preview only；無 write path；屬 FB-P5-c future |
| 5 | **Blogger / GitHub canonical 與 UTM 規則需避免互相污染** | GitHub → Blogger 已實作（含「策略 A：已含 UTM 保留 author intent」）；反向尚未；per `docs/click-tracking-governance.md` §3.1 + `CLAUDE.md` §16.4 |
| 6 | **AdSense 與 affiliate tracking 邏輯不同，不能混用** | per `docs/ad-affiliate-schema-proposal.md` §6.1（AdSense 不要自插 click event；不要干擾 AdSense 原生點擊）vs §6.2-§6.4（affiliate 用 `click_affiliate_cta`）；spec 已明標 |

---

## 7. Relationship to Existing Docs

本文件**僅提供 Phase 1 驗收口徑**；不取代以下文件之既有角色：

### 7.1 主要 cross-reference

| 既有文件 | 角色 | 本文件如何引用 |
|---|---|---|
| `README.md` | 專案主說明；含主要 npm 指令 + 第一階段已完成項目表 | 屬入口；本文件之 §3 不重述 |
| `CLAUDE.md` §28 / §29 / §30 | 第一版 MVP 必做 / 不做 / 最終樣貌 | 屬規範來源；本文件之 §2 / §5 echo |
| `docs/README.md` | docs 入口；含 §1 BLOG 系統定位 + §2 第一階段已完成能力 + §7 baseline | 本文件之 §3 cross-ref 各 schema docs |
| `docs/phase-1-completion-report.md` | Phase 9-z-d final completion report（含 §1-§13 詳細落地紀錄）| 本文件之 §3 acceptance check 之 evidence 來源 |
| `docs/phase-1-completion-checklist.md` | Phase 9-z-b 逐項對照清單（含 CLAUDE.md §28 17 條 + ~50 條 author SOP）| 本文件 §3 之子能力 mapping |
| `docs/20260522-phase-1-baseline-confirmation.md` | 5/22 Phase 1 基礎可運行正式宣告（含 8 modules confirmation + Phase 2 12 順序）| 本文件 §4 status snapshot 之依據 |
| `docs/20260522-day-1-readonly-a-report.md` | 5/22 read-only audit（§2 8 模組完成度 + §3-§6）| 本文件 §4 之具體狀態 |
| `docs/click-tracking-governance.md` | GA4 click 治理（9 click source / 6 event / 14 attr）| 本文件 §3.4 / §6 #2 cross-ref |
| `docs/ad-affiliate-schema-proposal.md` | Ad / affiliate 統一 schema（15 欄位 + 4 provider）| 本文件 §3.5 / §6 #3 / §6 #6 cross-ref |
| `docs/20260522-pm-phase-2-batch-plan.md` | Phase 2 12 批拆批 + 首注入 phase 名 | 本文件 §4.3 cross-ref |
| `docs/phase-2-candidate-roadmap.md` | Phase 2 候選 roadmap | 本文件 §8 cross-ref |
| `docs/custom-domain-root-files-strategy.md` | Custom domain 策略 docs | 本文件 §5 #1 cross-ref |

### 7.2 本文件之邊界

- ✅ 本文件**僅提供 Phase 1 驗收口徑**；不重寫 evidence / 不重寫 history / 不重寫 implementation detail
- ❌ 本文件**不取代**上述任一文件
- ❌ 本文件**不刪除 / 不合併**任何既有文件

---

## 8. Recommended Next Phase Candidates（僅列出；不啟動）

per `docs/20260522-pm-phase-2-batch-plan.md` §4 + `docs/phase-2-candidate-roadmap.md`：

| # | 候選 phase | 性質 | 對應 cross-ref |
|---|---|---|---|
| 1 | **GA4 link tracking spec**（day-2-c 候選 next batch）| docs-only | `docs/click-tracking-governance.md` + 既有 helper |
| 2 | **Admin usability small fixes**（pagination / filter / sort / collapse；day-2-d 候選）| read-only analysis + 後續 source | per §6 #1 risk |
| 3 | **Blogger output polish**（如 copy-helper / publish-checklist 子節微調）| source；屬 Phase 1 extension | `docs/phase-1-completion-report.md` §5.6 / §5.7 |
| 4 | **GitHub SEO polish**（如 meta tag tweaks / JSON-LD 細化）| source | `docs/seo-ga4-adsense.md` |
| 5 | **Custom domain planning**（read-only preflight；無實作）| docs-only | `docs/custom-domain-root-files-strategy.md` |

⚠️ **不啟動**：以上 5 候選皆**未啟動**；屬未來 user 表態。

⚠️ **本日剩餘建議 batch**（per day-2-a §4）：
- `day-2-c`：GA4 / Link Tracking 規格文件（docs-only）
- `day-2-d`：Admin 可用性小修候選盤點（read-only analysis）
- `day-2-e`：EOD Report（docs-only）

---

## 9. Cross-links（彙整）

- `README.md`（專案主說明）
- `CLAUDE.md` §28 / §29 / §30（規範來源）
- `docs/README.md`（docs 入口）
- `docs/phase-1-completion-report.md`（final completion report）
- `docs/phase-1-completion-checklist.md`（逐項對照）
- `docs/20260522-phase-1-baseline-confirmation.md`（5/22 baseline 宣告）
- `docs/20260522-day-1-readonly-a-report.md`（5/22 read-only audit）
- `docs/click-tracking-governance.md`（GA4 click 治理）
- `docs/ad-affiliate-schema-proposal.md`（Ad / affiliate schema）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 拆批）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap）
- `docs/custom-domain-root-files-strategy.md`（custom domain 策略）
- `docs/system-direction.md`（BLOG 系統整體方向）

---

（本文件結束）
