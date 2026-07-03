# C1-B0 Single Real Article Pre-Publish Checklist Dry-Run（docs-only）

- **Phase name**：`20260703-b-c1-b0-single-real-article-publish-checklist-dry-run-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-A` / post-K.5 readiness inventory）
- **Type**：**docs-only / read-only dry-run**。**不** publish、**不** deploy、**不** build、**不** preview、**不**碰 gh-pages / deploy clone、**不**改 `src/` / `content/` / `content/settings/` / `CLAUDE.md`、**不**自動修文章。唯一 mutation = 新增本檔。

---

## 0. Critical disclaimers（read first）

1. 本輪是**演練（dry-run）**，不是正式發布。**沒有**任何文章 `status` 被改動；design-token 文章仍為 `ready`，未 flip 為 `published`。
2. 本輪**未** build、**未** deploy、**未**碰 gh-pages、**未**碰 deploy clone、**未**改 Blogger / GA4 / AdSense / Search Console。
3. 唯一執行的指令為 **read-only prepublish guard pair**（`check:github-pages-prepublish` + `check:github-pages-prepublish-smoke`），兩者皆不 build / deploy / publish / fetch / pull。
4. 本文件**未**重跑 `npm run validate:content`（per CLAUDE.md 核心規則「不重跑 validate:content 除非 phase 要求 regression check」；本輪非 regression check）→ §4.5 validate 項採 **carry-forward baseline**（`0 error / 135 warning / 107 post`）。
5. 若文章有問題，只記錄 **PASS / WARN / BLOCKED**，**不修**。

---

## 1. Purpose

執行 C1 checklist（`docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`）§8 next-step **B**：由 Dean-side 指定一篇真實 GitHub 文章，走 §4 pre-publish checklist 單篇演練，確認：

- §4 checklist 是否能真正套用到現有真實文章（非 fixture、非 Admin scaffold）。
- 該文章在**不修改**前提下，哪些項目已 PASS、哪些是 WARN、哪些為 Dean-gated BLOCKED。
- 是否可進入下一階段（實際 flip / build / deploy）。

本文件**不是**正式發布，**不**觸發 build / deploy。

---

## 2. Session-start baseline（2026-07-03 07:26 AM, Asia/Taipei）

Source repo（`/d/github/blog-new/portable-blog-system`）：

```text
branch: main
HEAD = origin/main = 68b94e9865bbf6782cb5ff0bfee994d784d823ba
short: 68b94e9
subject: docs(state): record post k5 next-line readiness inventory
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
```

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；本輪僅由 prepublish guard read-only 驗證，未進入、未觸碰）：

```text
branch: gh-pages
HEAD = origin/gh-pages = d0f37eb
（guard 驗證：ahead/behind == 0/0；.git/index.lock absent）
```

Baseline **matched** on entry；未嘗試修正；deploy clone 未被本 phase 觸碰（僅 guard read-only rev-parse / status）。

---

## 3. 候選文章盤點與選定

`content/github/posts/` 現況（read-only；非 fixture）：

| 檔案 | status | contentKind | blogger.enabled | 備註 |
|---|---|---|---|---|
| `2026-07-01-github-pages-build-preview-workflow.md` | `published` | tech-note | — | 已發布，非「準備發布」候選 |
| `20260504-github-pages-blog-planning.md` | `ready` | tech-note | true (full) | body 為初始化 scaffold 佔位文；blogger 雙平台 |
| `20260504-portable-blog-system-mvp.md` | `ready` | download | true (summary) | 帶 intentional `noindex-follow` + `includeInListings` 例外；production 唯一 expected warning 來源 |
| `2026-06-30-what-is-design-token.md` | `ready` | tech-note | **false** | 真實正文、github-only、無特殊 SEO/listing 例外 |
| `2026-06-29-admin-ui-draft-generator-first-test.md` | `draft` | — | — | 仍 draft，非 ready candidate |

**選定：`content/github/posts/2026-06-30-what-is-design-token.md`**

**為什麼選它（最安全候選）**：

1. **真實正文**：body 為實際 Design Token 說明內容，非 Admin export 預設 scaffold（相對地 `github-pages-blog-planning.md` body 仍是「這是一篇初始化範例文章」佔位）。
2. **github-only**：`publishTargets.blogger.enabled = false` → 無跨平台 Blogger 發布連動，最小化 surface。
3. **無特殊例外**：不帶 `seo.indexing: noindex-follow` / `includeInListings`（相對地 `portable-blog-system-mvp.md` 帶 intentional noindex + listing 不對稱，是 production 唯一 expected warning 來源，走 checklist 會混入既有例外雜訊）。
4. **description / searchDescription 已填且具意義**，且長度均在門檻內（見 §4.3）。

---

## 4. §4 Pre-Publish Checklist 逐項結果（`2026-06-30-what-is-design-token.md`）

> 結果分級：**PASS**（符合）/ **WARN**（軟性提示、非 blocker）/ **BLOCKED**（需 Dean 明確授權，非文章瑕疵）。本輪**不修**任何項目。

### 4.1 Frontmatter contract

| 項目 | 值 | 結果 |
|---|---|---|
| `site` = `github` | `github` | ✅ PASS |
| `primaryPlatform` = `github` | `github` | ✅ PASS |
| `contentKind` 合法列舉 | `tech-note` | ✅ PASS |
| `title` 非空 | `什麼是Design Token?` | ✅ PASS |
| `titleEn` 非空 | `what is Design Token?` | ✅ PASS |
| `slug` 非空且無碰撞 | `what-is-design-token`（`content/github/posts/` 內唯一） | ✅ PASS |
| `date` / `updated` 合理 | `2026-06-30` / `2026-06-30` | ✅ PASS |
| `publishTargets.github.enabled === true` | `true` | ✅ PASS |
| `publishTargets.blogger.enabled` 維持 `false` | `false` | ✅ PASS |

### 4.2 Category / Tags registry

| 項目 | 值 | 結果 |
|---|---|---|
| `category` 存在於 `categories.json` 且 `site[]` 含 `github` | `tech-note` → entry `site: ["github","blogger"]` | ✅ PASS |
| `tags` 全存在於 `tags.json` 且各 `site[]` 含 `github`；無紅線禁用 tag | `["static-site"]` → entry `site: ["github"]` | ✅ PASS |

### 4.3 Cover / SEO 欄位

| 項目 | 值 / 量測 | 結果 |
|---|---|---|
| `description` 已填、非佔位 | 具意義段落；長度 ≈ 95 chars（< `DESCRIPTION_MAX` 160；不觸發 `long-description`） | ✅ PASS |
| `searchDescription` 已填 | 具意義段落；長度 ≈ 91 chars（< `SEARCH_DESCRIPTION_MAX` 200；不觸發 `long-search-description`） | ✅ PASS |
| `cover` / `coverAlt` 一致性 | `cover: /images/placeholders/cover-placeholder.svg` + `coverAlt: 什麼是Design Token? cover placeholder` | ⚠️ WARN（advisory） |

> **4.3 WARN 說明（非 blocker）**：`cover` 目前為 placeholder SVG，`coverAlt` 亦為 "cover placeholder" 字樣。一致性成立（有 cover → coverAlt 有值），checklist 不擋 ready；但若未來要正式發布為對外文章，建議 Dean 換上真實封面圖 + 具描述性 alt。**本輪不修。**

### 4.4 內容完整性

| 項目 | 觀察 | 結果 |
|---|---|---|
| body 為正式正文，非 Admin scaffold | body 為實際 Design Token 說明，非預設佔位 | ✅ PASS |
| body 內無第二個 `# ` 一級標題 | body 全文無任何 `# ` 標題（frontmatter `title` 為唯一 H1） | ✅ PASS |

### 4.5 全站回歸（發布前 baseline 未回退）

| 項目 | 觀察 | 結果 |
|---|---|---|
| `npm run validate:content` → 0 error | **本輪未重跑**（非 regression phase）；carry-forward baseline `0 error / 135 warning / 107 post` | ✅ PASS（carry-forward） |
| 無測試 / 暫存 `.md` 殘留於 `content/github/posts/` | `ls` 僅 6 個真實 `.md` + 1 個 `.fb.md`；無 `phase1-e2e-*` / 暫存檔 | ✅ PASS |
| `git status --short` clean | 進場 clean（本檔新增前） | ✅ PASS |

### 4.6 發布決策 gate（Dean 手動）

| 項目 | 結果 |
|---|---|
| Dean 已確認這篇要 `ready` / `published` | 🔴 BLOCKED（本輪為 dry-run；Dean 未授權 flip 為 published） |
| Dean 已明確授權「是否真的進 build」 | 🔴 BLOCKED（Dean 未授權 build） |
| Dean 已明確授權「是否真的進 deploy（push gh-pages）」 | 🔴 BLOCKED（Dean 未授權 deploy） |

> §4.6 三項 BLOCKED **不是文章瑕疵**，而是**設計上的 Dean-gated 決策點** —— 這正是 dry-run 停在此處的原因。

---

## 5. Read-only 自動驗證（本輪唯一執行的指令）

依 C1 checklist §10 automated verification pointer，跑 read-only guard pair（皆不 build / deploy / publish / fetch / pull）：

```text
npm run check:github-pages-prepublish        → 16/16 PASS
npm run check:github-pages-prepublish-smoke  → 8/8 PASS
```

- guard 同時 read-only 驗證 source repo（branch / HEAD / clean / ahead·behind / index.lock）與 deploy clone（ahead/behind == 0/0；index.lock absent）→ 兩 repo baseline invariant 皆成立。
- **未** build、**未** deploy、**未** push、**未** flip status。

---

## 6. 結論

### 6.1 §4 checklist 是否能套用到真實文章？

**能。** §4 checklist 對 `2026-06-30-what-is-design-token.md` 完整可套用：4.1 / 4.2 / 4.4 / 4.5 全 PASS；4.3 一項軟性 WARN（cover placeholder，非 blocker）；4.6 三項為 Dean-gated BLOCKED（決策點，非瑕疵）。無任何 checklist item 因文章結構問題而無法評估。

### 6.2 是否可以進入下一階段？

- **技術面（4.1–4.5）**：✅ 已 ready，無 error 級阻礙；唯一 WARN（cover）為軟性、可留待正式發布前處理。
- **決策面（4.6）**：🔴 **尚不可自動進入下一階段**。實際 flip `ready → published` / build / deploy 全數需 **Dean 明確授權**，本輪一律不執行。
- 換言之：**dry-run 判定「這篇技術上 publish-ready」，但「是否真的發布」是 Dean 的決策，未授權前 hold。**

### 6.3 哪些項目需要 Dean 明確批准

1. **flip status `ready → published`**（手動編輯 frontmatter；Claude 不自動 flip）。
2. **是否進 build**（`npm run build` 等；本輪未跑）。
3. **是否進 deploy / push gh-pages**（碰 deploy clone；本輪未碰）。
4.（可選）**cover placeholder → 真實封面圖 + 具描述性 coverAlt**（§4.3 WARN；非強制）。

### 6.4 本輪明確未做（重申）

- ❌ 無 publish（未 flip 任何 status）
- ❌ 無 build
- ❌ 無 deploy / gh-pages push
- ❌ 無 deploy clone 觸碰（僅 guard read-only 驗證）
- ❌ 無 Blogger / GA4 / AdSense / Search Console 動作
- ❌ 無 `src/` / `content/` / `content/settings/` / `CLAUDE.md` 改動
- ❌ 無自動修文章

---

## 7. 本 phase 邊界（self-check）

- ✅ 唯一 file change：新增本檔 `docs/20260703-c1-b0-single-real-article-publish-checklist-dry-run.md`。
- ✅ 未改 `src/` / `views/` / `scripts/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- ✅ 未 build / deploy / preview / dev server / repost / gh-pages；deploy clone 未觸碰（僅 guard read-only 驗證）。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console。
- ✅ 未引入 Playwright / 新 devDependency。
- ✅ 未重跑 `validate:content`（carry-forward baseline）；唯一執行 = read-only prepublish guard pair（16/16 + 8/8）。
- ✅ 未改任何文章 `status`（design-token 仍 `ready`）。

---

## 8. Cross-links

- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（C1 checklist；本輪執行其 §4 + §8 option B + §10 guard pair）。
- `docs/20260703-post-k5-next-line-readiness-inventory.md`（§4.2 C1-B candidate；本輪即其落地）。
- `docs/20260701-github-draft-publish-readiness-checklist.md`（單篇 metadata / SEO gate 細節）。
- `docs/github-deploy.md`（F-01 deploy runbook；未來 build/deploy 權威流程）。
- `CLAUDE.md` §3a Validation baseline（`check:github-pages-prepublish` 16/16 + smoke 8/8）+ Red lines。

---

（本文件結束 / end of document）
