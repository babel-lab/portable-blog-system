# Project-wide Status Checkpoint — Post-N9 Frozen State

Phase: `20260611-pm-1-project-wide-status-checkpoint-refresh-docs-a`
Date: 2026-06-11 12:03 +0800
Status: **docs-only project-wide frozen snapshot**

---

## 0. Purpose

本文件為 **2026-06-11 中午 AdSense N9 GitHub Pages repo-side 封箱後** 之整套 BLOG 系統 frozen-state project-wide status checkpoint，**取代** 已 stale 的 `docs/20260608-project-wide-status-checkpoint.md`（舊 snapshot 停在 HEAD `5b3177f` / baseline `0/69/59`，未反映 N9 全系列、commerce L1 seed、we-media R3 migration）。

- 文件性質：**docs-only**。唯一變更 = 新增本檔。
- 本文件**不代表**任何 source / registry / content / template / src / Admin / renderer / build / deploy / Blogger repost / GA4 動作。
- 本文件**不**新增、不撤銷既有 governance；`CLAUDE.md` / `MEMORY.md` / 既有 docs 為 source of truth，本文件僅為 frozen-state 快照。
- 本文件**不含** real AdSense client / slot id；一律以 masked（如 client `ca-pub-…3759`）、`slotKey`、`anchor`、`articleAd1`..`articleAd6` 表述。real id **僅**存於 `content/settings/ads.config.json`。

---

## 1. Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD at phase start | `a874b32` |
| origin/main | `a874b32` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(adsense): add n9 closure checkpoint` |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** |
| overlay validate（`commerce-c4-c9-overlay.json`） | **0 errors / 101 warnings / 85 posts** |
| `npm run check:adsense-resolver` | **33 passed / 0 failed** |
| production `commerceLinks` | **10 active entries**（L1 seeded；全 `networkKey: books` / 通路王） |
| production `downloadAssets` | empty `[]` |
| production `downloadForms` | empty `[]` |

Overlay 指令（**direct-node only**；loader 不讀 overlay）：

```bash
node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
```

baseline 數值皆於本 phase **實跑取得**，非引用記憶。

---

## 2. Closed / completed areas

### 2.1 AdSense N9 — GitHub Pages article ads：**repo-side CLOSED / PASS**

- production `content/settings/ads.config.json` `enabled: true`（N9e 僅改此一欄位 false→true，commit `3e1f4e3`）。
- **6 real article slots** `articleAd1`..`articleAd6` present（real id 僅存 `ads.config.json`，本文件不列印）。
- **resolver**（`src/scripts/resolve-adsense-blocks.js`）消費 `ads.defaults.blocks[]`（6 blocks，每 block `surfaces: ["pages"]`、`enabled: true`、`order` 1–6）。block source 優先序 = post-specific `post.adsense.blocks` → site `defaults.blocks[]` → `{}`。
- **3-gate**：須 `ads.enabled===true` + 非空 `adsenseClient` + 非空 slot id 才產生 resolved block；缺任一 → no-op。post-level `adsense.enabled===false` 連 site default 一併壓制。blogger surface → `{}`（by design）。
- slot→anchor 對映（N9d policy，top→bottom）：`articleAd1`→`afterHeader` / `articleAd2`→`afterCover` / `articleAd3`→`afterBookPhoto` / `articleAd4`→`afterAffiliateTop` / `articleAd5`→`beforeAffiliateBottom` / `articleAd6`→`beforeRelatedLinks`。
- **N9e GitHub Pages deploy + live verify 已完成**（gh-pages `2acb5a5→c15e514`；live `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/` 載入正常、無 template leak；實際 ad fill 屬 AdSense 端）。
- **N9f resolver guard correction**：`check-adsense-resolver.js` Case 21 由舊「assert production `enabled:false` → {}」更新為 post-N9e enabled production invariant（present-check only，不列印 real id）；resolver 恢復 **33/33**。
- **N9 closure checkpoint doc**：`docs/20260611-adsense-n9-closure-checkpoint.md`（verdict = repo-side CLOSED / PASS）。

### 2.2 Commerce — L1 seed：**landed**

- production `content/settings/commerce-links.json` = **10 active entries**（全 `networkKey: books` / 通路王販書 redirect；`targetUrl` 保留 affiliate redirect 含 `uid1=blog`，不 canonicalize）。
- **`we-media-myself2.md` 已 R3 url→ref migration**（2 筆 url→ref，指向 active `linkId`）。
- resolver `deriveRenderedAffiliateLinks` + block resolver `deriveRenderedAffiliateBlocks`（`src/scripts/resolve-affiliate-links.js`）live；smoke `check-commerce-affiliate-resolver.js` 23/23（須 direct-node 帶 overlay flag）。
- Blogger renderer wiring + we-media Blogger-only `affiliate.blocks[]` content migration landed（GitHub Pages 維持 legacy 單區塊，byte-identical）。
- **commerce L2 seed 對新 candidate 仍 BLOCKED**：須 user-provided `commerceSeedCandidates:` YAML + explicit approval（見 §3.1）。

### 2.3 Download — registry / validator：**landed warning-only；registry dormant**

- validator landed warning-only（registry-level R1 shape + R2 ref-not-found + R5b intra-post duplicate；frontmatter D1/D2/D3 + `assetRefs[]` / `formRef` shape rules）。
- production `download-assets.json` / `download-forms.json` 仍 **empty `[]`**；loader read-only 載入、無下游 consumer。
- renderer / landing page / Admin picker / content migration **全 dormant**。
- production 0 篇用 `assetRefs[]` / `formRef` → production 觸發為零。

### 2.4 Content validation baseline

- 現況穩定 **0 errors / 94 warnings / 84 posts**（normal）。
- 依 `CLAUDE.md` ledger + 本 phase 實際 validate 輸出：94 warnings **全部來自 `content/validation-fixtures/`（`_test-*.md` 等 fixture posts）**；**production posts 觸發 0 warnings**（empty download registries + production commerce refs 對 active registry valid → C3/C4/C9 + download R2/R5b 全 0 觸發）。
- overlay 多 +7（94→101）來自 commerce C4/C9 overlay replace-semantics 下之 fixture + we-media ref C3 not-found（migration-related；見 N9 / commerce 相關 docs）。

### 2.5 其他 Phase 1 MVP 能力（以 `docs/README.md` §2 + `CLAUDE.md` 實際記錄為準）

- ✅ Vite + EJS 靜態站本機預覽（`npm run dev`）。
- ✅ Markdown + frontmatter 文章；分類 / 標籤 / 文章 / Design System 頁。
- ✅ Blogger 匯出（full / summary / redirect-card）+ Blogger Design Token CSS 匯出。
- ✅ FB Promotion 文案匯出（手動發布）。
- ✅ SEO meta / sitemap / robots / canonical / OG / JSON-LD；SEO indexing 控制。
- ✅ GA4 機制 production live（measurementId `G-C77SMPF8VD`）。
- ✅ Link Processor（外連 nofollow / sponsored；GitHub→Blogger cross-link auto UTM production live）。
- ✅ Sticky Header / Mobile Drawer / Back to Top / RWD。
- ✅ Admin overview（read-only / dev-mode-only）+ SEO 4 欄位 dry-run viewer + FB sidecar read-only display / dry-run editor。

---

## 3. Dormant / deferred / blocked areas

### 3.1 user-input blocked（須 user 提供資料才可啟動）

| 項目 | 解除條件 |
|---|---|
| **commerce L2 seed** | user-provided `commerceSeedCandidates:` YAML + explicit approval；逐筆 manual review，通過治理紅線 |
| **download production migration** | real safe Google Drive asset URL / Google Form embed URL + registry seed decision + content model 裁決 |
| **commerce C7 missing-role rule** | user product decision；目前 **NO-GO** |

### 3.2 out-of-repo blocked（須 Blogger 後台 / deploy / GA4 驗收）

| 項目 | 解除條件 |
|---|---|
| **Blogger AdSense surface** | `loader.blogger` 決策 + Blogger backend 重貼 + 原文 HTML 備份 + Blogger live theme CSS 確認 + user explicit approval（現行 `defaults.blocks[]` 全 `surfaces:["pages"]`，blogger surface resolver 回 `{}`；**不得**沿用 GitHub Pages setting 直接硬開） |
| **reverse UTM deploy gate（pm-26）** | valid natural GitHub cross-link fixture + GA4 Realtime / DebugView 驗收 + Blogger 後台重貼 + explicit deploy approval（source landed but dormant） |
| **Blogger commerce affiliate repost** | user approval + 原文備份 + Blogger live theme CSS 確認（render + content ready；dual-block 策略已 lock） |

### 3.3 high-risk / not-now

- sitemap 多平台拆分（結論：當前不建議實作）。
- `_blogger-components-rules.scss` mirror partial 整合（DS-3-e 🔴 高風險）。
- Admin write path（Apply / middleware write / admin-write-cli）—— 須獨立 governance + source + acceptance 三 phase。
- FB Graph API / Blogger API / 自動社群發文 —— `CLAUDE.md` §29 第一版永不。

---

## 4. Red lines（目前仍有效）

- ❌ **No unapproved deploy**（含 `npm run build` 上線 / `dist*/` / `gh-pages` push）。
- ❌ **No Blogger repost without backup / explicit approval**。
- ❌ **No AdSense backend mutation**（不碰 AdSense 後台）。
- ❌ **No GA4 new dimension without separate phase**（ad / commerce dimension 屬新 surface，須獨立 phase + preanalysis）。
- ❌ **No Admin write path without governance**（Apply / middleware / admin-write-cli 任一 component 須獨立 governance + source + acceptance phase）。
- ❌ **No commerce seed without user YAML / approval**（L2 對新 candidate BLOCKED；AI 不生成假 seed / 不用 URL pattern 推斷 key）。
- ❌ **No real AdSense client / slot id in docs**（docs 一律 masked / `slotKey` / `anchor` / `articleAd1`..`articleAd6` 表述；real id 僅存 `ads.config.json`）。
- ❌ **No real affiliate tracking URL / token / credential / Drive folder ID / Form ID / respondent data 入 repo**。
- ❌ **No production content migration without explicit approval**。
- ❌ **No renderer activation without seed / approval**（commerce / download landing 皆 dormant）。
- ❌ **No `_sample.*` / fixture promote** 至 production registry / production posts。
- ❌ **No git amend / rebase / force-push**（push 採 fast-forward only；commit 採 new commit only）。

---

## 5. Safe next candidates（列出，不執行）

依風險分類；本 phase **不**自動啟動任一。

### A. Safe docs-only

1. **README baseline sync（docs-only）**：`docs/README.md` §4 註解 + §7.0 仍寫 HEAD `b7d5c14` / `0/69/59`，與現況 `a874b32` / `0/94/84` / overlay `0/101/85` 不符；docs-only 數字同步。
2. **Blogger AdSense surface preanalysis（docs-only）**：盤點 `loader.blogger` 決策、per-block `surfaces:["blogger"]` gating、Blogger 重貼 / 備份 / theme CSS 前置；不改 source / config。

### B. Needs user input / explicit approval

3. **commerce L2 seed** — only after user 提供 `commerceSeedCandidates:` YAML + approval。
4. **download production migration** — only after real safe asset URL / Form embed URL provided。
5. **Blogger AdSense surface activation / reverse UTM deploy / Blogger commerce repost** — 須 §3.2 各自解除條件 + user explicit approval。
6. **C7 source / Admin write path** — 須 user product decision / 獨立 governance phase。

---

## 6. Final verdict

- **post-N9 baseline frozen：PASS**（HEAD `a874b32`；validate 0/94/84；resolver 33/33）。
- **No immediate repo-side AdSense blocker observed.**
- **Recommended next after this checkpoint** = README baseline sync（docs-only）或由 user 選定新 workstream。
- 本文件為 **informational / docs-only**；不取代既有 governance；任何進一步動作須 user 明示啟動。

---

（本文件結束）
