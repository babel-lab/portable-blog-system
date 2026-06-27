# Admin `ready` mode validator impact preanalysis（docs-only）

- **Date**: 2026-06-27
- **Branch**: `main`
- **Baseline HEAD**（at session start）: `c1884a8bb8bdb1ad2d7d051729f1f5876f2a6f98`
- **Last commit subject**: `feat(admin): add markdown import checklist`
- **Scope**: Phase 1 Admin UI / Markdown MVP — `status: ready` / `READY_STATUS` 對 validator / build pipeline 的影響盤點。
- **本文件是 preanalysis，沒有實作 ready mode。** 沒有修改 source / Admin UI / content / package / lockfile，也沒有 deploy / Blogger live / GA4 / Form / Drive / AdSense / Search Console 後台動作。

---

## 1. Baseline verify（session 開始時）

| 項目 | 結果 |
| --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `c1884a8bb8bdb1ad2d7d051729f1f5876f2a6f98` |
| last commit subject | `feat(admin): add markdown import checklist` |
| working tree | clean |
| ahead/behind `origin/main` | `0 / 0` |
| `.git/index.lock` | absent |

對齊 CLAUDE.md §3a 「最新 frozen baseline 更新」紀錄。

---

## 2. Validations result（read-only baseline 重跑）

| 指令 | 結果 | baseline 對齊 |
| --- | --- | --- |
| `npm run check:admin-markdown-export` | 39 / 39 PASS | ✅ |
| `npm run validate:content` | 0 error / 134 warning / 106 post | ✅ |
| `node src/scripts/check-page-type-validator.js` | 110 / 0 | ✅ |
| `npm run build:github` | PASS（305ms） | ✅ |
| `npm run build:blogger` | PASS（175ms） | ✅ |

全數對齊 CLAUDE.md §3a validation baseline 表。Production expected warning = 1（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`，warning-only / 非阻擋），其餘 warnings 來自 `content/validation-fixtures/`。

---

## 3. Draft / ready / published filtering model（系統觀）

```
┌─────────────────────┐
│ content/{site}/posts/*.md             frontmatter.status: draft|ready|published|archived
└─────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ src/scripts/load-posts.js   classify(data)                          │
│   • draft: true                      → filtered out                 │
│   • status === 'draft' / 'archived'  → filtered out                 │
│   • status missing                   → fallback 'draft' → filtered  │
│   • status ∈ {ready, published}      → included                     │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Downstream consumers（全部讀 loadPosts() 之 included posts）         │
│   • validate-content.js                                             │
│   • build-github.js / build-blogger.js                              │
│   • build-sitemap.js / check-include-in-sitemap.js                  │
│   • check-include-in-listings.js                                    │
│   • build-promotion.js                                              │
│   • report-*.js                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**唯一例外**：`src/scripts/load-admin-posts.js`（注解第 3 行：「不沿用 load-posts.js 之 status filter（admin 需顯示 draft 含其他狀態）」）。Admin loader 自己列 draft 用於 UI 顯示，但**不會** push 進 validator pipeline；它是 read-only consume validation-report 的快照。

---

## 4. `load-posts.js` 的關鍵規則

`src/scripts/load-posts.js:21-28`：

```js
const VISIBLE_STATUS = new Set(['ready', 'published']);

function classify(data) {
  if (data.draft === true) return { include: false, reason: 'draft:true' };
  const status = data.status ?? 'draft';
  if (!VISIBLE_STATUS.has(status)) return { include: false, reason: `status:${status}` };
  return { include: true, reason: 'ok' };
}
```

**語意鎖**：

1. `draft: true` 永遠勝出（即使 `status: ready`，仍被排除）。
2. `status` 若缺漏，視為 `draft`。
3. 只有 `(draft !== true) && (status ∈ {ready, published})` 才進入下游。
4. 過濾後的物件被推入 `posts[]`；filtered out 紀錄在 `filteredOut[]`（含 reason），但**不**進 validator。

**這就是 Admin export 強制 `status: "draft"` + `draft: true` 等於 zero-warning safe path 的根本原因**：檔案被存進 `content/{site}/posts/` 之後，loadPosts 直接 filter 掉，validator 從未看到它。

---

## 5. `validate-content.js` READY_STATUS gate 影響

### 5.1 常數定義

`src/scripts/validate-content.js:29-30`：

```js
const VALID_STATUS = new Set(['draft', 'ready', 'published', 'archived']);
const READY_STATUS = new Set(['ready', 'published']);
```

### 5.2 主 gate 範圍

`validate-content.js:2211` 之 `if (typeof status === 'string' && READY_STATUS.has(status)) { ... }` 一直延伸到 `:2886`，**包住絕大多數 post-level validation rules**：

- **ERROR**：`missing-title`、`missing-slug`、`missing-date`、`invalid-date-format`
- **WARNING（SEO 內容品質）**：`missing-description`、`missing-category`、`missing-cover`、`empty-tags`、`body-leading-h1`、`long-title` / `long-description` / `long-search-description`
- **WARNING（schema 一致性）**：`invalid-site`、`invalid-content-kind`、`contentkind-and-type-conflict`、`invalid-seo-block`、`invalid-seo-indexing`、`invalid-primary-platform`、`invalid-canonical`、`invalid-publish-target-mode`
- **WARNING（contentKind-specific）**：D1–D5 download 結構、commerce C1–C9、affiliate.blocks[]、adsense.blocks[]、SP-2 pageType、downloadFunnel 各條、book schema 多條、series 多條、relatedLinks / otherLinks

### 5.3 gate 外仍會觸發的規則

- **invalid-status (ERROR)**（loop 進入點檢查；任何 status 都檢，包括 `draft` 文章——只是 loader 已濾掉所以實務不會跑到）
- **cross-post**：`duplicate-slug`（ERROR）、`series-number-duplicate`（warning）、downloadFunnel reciprocity 等——**只看 loadPosts 後集合**，draft 已不在集合內
- **registry-level**：`download-registry-invalid-shape` / `download-registry-duplicate-key`、ads / adsense settings shape——與 status 無關
- **FB sidecar 動態 severity**（`severityForFbContentMissing` / `severityForFbPlaceholder`）：`published` → error；`ready` → 部分 error；`draft / archived / 未知` → 全 warning

### 5.4 build readers 對 status / draft 的依賴

- `build-github.js`：grep `status|draft|VISIBLE` 全 miss，**完全不檢 status**
- `build-blogger.js`：只在 `:641-642` 把 `post.status` / `post.draft` 塞進 meta.json / build-manifest，**無條件分支**
- → build 端**完全信任** loadPosts 的過濾結果

---

## 6. Admin current draft export vs ready gap

`src/scripts/admin-markdown-export.js` 之 `buildPostMarkdown` 目前輸出的 frontmatter（強制 `status: "draft"` + `draft: true`）：

```yaml
id, site, contentKind, primaryPlatform,
title, titleEn:"", slug,
date, updated, author:"Dean",
category, tags(可為 []),
description, searchDescription:"",
cover:"", coverAlt:"",
status:"draft", draft:true,
canonical:"auto",
publishTargets.{github,blogger}.{enabled, mode},
blocks.{toc, adsenseTop, adsenseMiddle, adsenseBottom, hashtags, socialFollow, relatedPosts, sidebar}
```

**Schema 已含全部 `ready` 必要欄位**，差別在於有些欄位是 placeholder（`""` / `[]`），且 `status: "draft"` 讓 loader 直接過濾不進 validator。

---

## 7. ERROR / WARNING risk matrix（若把 status 直接切成 ready）

### 7.1 ERROR（會讓 `validate:content` exit 1）

| 規則 | 條件 | Admin 目前產出狀態 | 結論 |
| --- | --- | --- | --- |
| `missing-title` | title 空 | UI 已 gate `isExportReady` | ✅ 不會觸發 |
| `missing-slug` | slug 空 | sanitizeSlug 已限制 | ✅ |
| `missing-date` | date 空 | sanitizeDate 已限制 | ✅ |
| `invalid-date-format` | date 不符 `^\d{4}-\d{2}-\d{2}$` | sanitizeDate 已限制 | ✅ |
| `duplicate-slug`（cross-post） | repo 已有同 slug 之 ready/published post | Admin 單篇無法判定 | ⚠️ **真正 ready blocker**：須在 ready gate 時對 loader 已知 slugs 做 preflight |
| `invalid-status` | status 不在 4 enum | Admin 限定 "draft" / "ready" | ✅ |

### 7.2 WARNING（會 bump 134 baseline）

| 規則 | 條件 | Admin 目前產出狀態 | 結論 |
| --- | --- | --- | --- |
| `missing-description` | description 空 | UI 允許空 | ⚠️ ready gate 需強制非空 |
| `missing-category` | category 空 | UI 為 free text，可空 | ⚠️ ready gate 需強制非空且對齊 categories.json |
| `missing-cover` | cover 空 | 預設 `cover: ""` | ⚠️ ready gate 需提示填值（可用 placeholder URL） |
| `empty-tags` | tags trim 後為 [] | UI 允許空 tags | ⚠️ ready gate 需強制至少 1 tag |
| `body-leading-h1` | body 第一行 `# ` | `defaultBody()` 用 `##` | ✅ 預設安全 |
| `long-title` / `long-description` / `long-search-description` | 超過 60 / 160 / 200 字 | UI 沒長度限制 | ⚠️ soft warning；非阻擋 |
| `invalid-content-kind` / `invalid-site` / `invalid-primary-platform` / `invalid-publish-target-mode` / `invalid-canonical` | 非 enum | `pickEnum` 已限制；mode / canonical 寫死 | ✅ |
| `unknown-category` / `unknown-tag` | 非 categories.json / tags.json 中 | UI 無 enum picker | ⚠️ ready gate 需 picker |
| `category-site-mismatch` / `tag-site-mismatch` | site 不在 categories.site / tags.site | 同上 | ⚠️ 同上 |

---

## 8. contentKind-specific risk

| contentKind | 額外 warning 風險 |
| --- | --- |
| `tech-note` / `post` / `life-note` / `comic` / `page` | **無** contentKind-specific 額外 warning（前提：不寫 download / book / affiliate / funnel block） |
| `book-review` | 需 `book.title` / `book.authors[]` / `book.publisher` / `book.mediaType` / `affiliate.*`；缺則觸發大量 `book-*` 與 `commerce-ref-*` warning |
| `download` | 需 `download.fileUrl`，否則 `download-enabled-fileurl-empty`；contentKind=download 還有 SEO-1 fallback path / listing 規則 |
| funnel pages（pageType: `gated_download` / role: `entry` / `gated_page`） | 觸發 `downloadFunnel` reciprocity / role-policy 多條規則 |

**第一版 ready option 不應支援 `book-review` / `download` / funnel 類**。

---

## 9. 為何不直接開 ready option（A 路徑）

**主要風險**：

1. **UI gating 表面工程量大**：必填欄位 picker（category / tags / cover）、長度提示、enum 限縮、slug uniqueness preflight、cross-post 集合 fetch—— 全部要實作完整才能保證使用者輸出 0-warning ready 文件；漏一條就會 bump baseline。
2. **contentKind 子集限制需明確 enforcement**：book-review / download / funnel 直接切 ready 會炸 5–15 條額外 warning。
3. **使用者誤觸成本高**：若 UI 顯示 "Ready"，使用者很可能誤認為「可發佈」按鈕；實際只是進入 validator 視野，沒解決 Blogger / GitHub 發佈動作。
4. **與 §29「第一版禁止真正後台」精神有摩擦**：ready option 若沒嚴格 gate，會誘導使用者期待 admin 是真正後台。

**建議延後**：在 B 路徑（preflight panel）累積使用經驗 + 收集 gap 提示後再回頭評估。

---

## 10. 下一步建議：B 路徑 — `ready preflight panel`

### 10.1 範圍

- 在 `src/views/admin/index.ejs` `#new-post-draft` 區塊新增一個 **read-only panel**
- 重用 `isExportReady`-style helper（候選名稱：`analyzeReadyGap(input)`，純函式，不 I/O、不 fetch、不 throw）
- panel 顯示：若使用者把 `status` 改成 `ready`，validator 會缺哪些欄位 / 觸發哪些 warning（base on input 即時計算）
- export 仍輸出 `status: "draft"` + `draft: true`；**不**新增 ready option

### 10.2 預期欄位 gap 提示

- **ERROR-blocking**：title / slug / date / date-format（這些已被 `isExportReady` 擋住）
- **WARNING-bumping**：description / category / cover / tags / long-* / unknown-category / unknown-tag
- **contentKind-specific 警示**（純展示性）：選 book-review / download / funnel 時提示「本 contentKind 不建議直接切 ready」

### 10.3 為什麼安全

| 風險面 | 評估 |
| --- | --- |
| validator baseline 影響 | 0（檔案輸出仍 status:"draft"，loader 仍過濾） |
| source mutation 範圍 | admin UI partial + 1 個純函式 helper |
| 是否需新增 smoke | 是；建議擴 `check:admin-markdown-export` 加入 `analyzeReadyGap` 純函式測試 |
| 是否影響 Blogger / GitHub build | 否 |
| 是否影響 deploy / live | 否 |
| 是否影響 Admin write path | 否（write path 仍 dormant） |
| 與 §29 第一版禁止項目衝突 | 否 |

### 10.4 命名建議（待 source slice 階段確認）

- panel 標題：建議 `Ready preflight check`（read-only 提示，非按鈕）
- helper 名稱：`analyzeReadyGap(input)` → 回 `{ blockingErrors:[], warningCandidates:[], contentKindNotes:[] }`
- 不引入新的 status enum value

---

## 11. 明確聲明：本文件是 preanalysis，沒有實作 ready mode

本文件**僅**為 read-only 分析紀錄。本 session **無**以下動作：

- ❌ 沒有修改 `src/` / `views/` / `scripts/`
- ❌ 沒有修改 `src/scripts/admin-markdown-export.js`
- ❌ 沒有修改 `src/views/admin/index.ejs`
- ❌ 沒有新增 `ready option` / `analyzeReadyGap` helper
- ❌ 沒有修改 `content/`
- ❌ 沒有修改 `package.json` / lockfile
- ❌ 沒有 deploy / push gh-pages / 動 `dist/`
- ❌ 沒有 Blogger live / GA4 / Google Form / Google Drive / AdSense / Search Console 後台動作

本文件落地後之 frozen baseline 即為 docs-only commit：commit subject 與 hash 由 落地 commit 自動產生（見 CLAUDE.md §3a 後續更新）。

下一個 session 起始任務候選＝**B 路徑 source slice：`ready preflight panel`**（須獨立 Dean approval + 獨立 phase）。
