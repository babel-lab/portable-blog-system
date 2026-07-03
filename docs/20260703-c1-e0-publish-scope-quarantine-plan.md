# C1-E0 Publish Scope Decision & Quarantine Plan（docs-only）

- **Phase name**：`20260703-e-c1-e0-publish-scope-decision-and-quarantine-plan-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-D` / C1-D0 inventory）
- **Type**：**docs-only / read-only 決策建議**。**不**改 `content/` / `src/` / `content/settings/` / `CLAUDE.md`、**不** flip status、**不** build、**不** preview、**不** deploy、**不**碰 gh-pages、**不**改 Blogger / GA4 / AdSense / Search Console、**不** `npm install` / dependency / lockfile。唯一 mutation = 新增本檔。

---

## 0. Critical disclaimers（read first）

1. **本輪沒有 build / deploy / preview / flip / gh-pages。** 只產出「第一次 deploy 前應納入哪些文章 / 哪些應 quarantine」之決策**建議**。
2. 所有「建議改 status」皆為**建議**，**未實際修改任何文章**。實際 flip 由 Dean 手動決定並執行。
3. deploy clone（`portable-blog-deploy` / gh-pages）本輪**未進入、未觸碰**。

---

## 1. Purpose

承接 C1-D0（`docs/20260703-c1-d0-build-inclusion-inventory.md`）之發現：若現在 `npm run build`，會**一次納入 4 篇**（3 ready + 1 published），其中 `github-pages-blog-planning` 為 **scaffold 佔位文但 `status: ready`**，存在未預期上線風險。

本文件對這 4 篇提出**第一次 deploy 的最小安全 scope 建議**：每篇是否可接受首次上線、是否應 quarantine、quarantine 方式、是否需 Dean 決策。

---

## 2. Session-start baseline（2026-07-03, Asia/Taipei）

```text
source: /d/github/blog-new/portable-blog-system
branch: main
HEAD = origin/main = 5652fdafcbbb75ba97f57bf200ac9c0280af5e93
short: 5652fda
subject: docs(publish): inventory build inclusion before first deploy
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent

deploy clone: /d/github/blog-new/portable-blog-deploy（未進入）
gh-pages = origin/gh-pages = d0f37eb（carry-forward；未觸碰）
```

Baseline **matched** on entry。

---

## 3. 系統支援的 quarantine 手段（native github post）

C1-D0 已確認：`content/github/posts/` 全部為 **native github post**，loader 過濾**只看 `draft` / `status`**（`publishTargets.github.enabled` 只對 blogger-cross post 生效，對 native post **無排除效果**）。因此可用手段：

| 手段 | 效果 | build 納入? | sitemap? | listing? | 適用 |
|---|---|---|---|---|---|
| `status: draft` + `draft: true` | **完全排除**（loader 過濾） | ❌ | ❌ | ❌ | ✅ 完整 quarantine（推薦） |
| `status: archived` | **完全排除**（不在 `VISIBLE_STATUS={ready,published}`） | ❌ | ❌ | ❌ | 退役文章語意；非未完成稿 |
| `seo.indexing: noindex-*` | 仍 build + listing，僅出 sitemap | ✅ | ❌ | ✅ | 部分遮蔽；**非**完整 quarantine |
| `includeInListings: false` | 移出 listing 卡片，detail 頁仍 build + sitemap | ✅ | ✅ | ❌ | 部分遮蔽；**非**完整 quarantine |
| `publishTargets.github.enabled: false` | **對 native post 無效**（不過濾） | ✅ | ✅ | ✅ | ❌ 不可用作 native quarantine |

> **關鍵**：native github post 要「完全不上線」，只能靠 `draft: true` 或 `archived`。其餘手段只是部分遮蔽。

---

## 4. 逐篇 scope 建議

| # | 文章 | 現況 | 內容性質 | 首次上線可接受? | 建議 |
|---|---|---|---|---|---|
| 1 | `github-pages-blog-planning.md` | ready / indexable | **scaffold 佔位文**（body =「這是一篇初始化範例文章…」） | 🔴 **否** | **quarantine → `draft`** |
| 2 | `portable-blog-system-mvp.md` | ready / download / noindex-follow / in-listings | 真實正文（Phase 1-A 範例，有「本階段重點」段落）；noindex | 🟡 可接受（低風險） | **建議保留**；Dean 可選 quarantine（見註 B） |
| 4 | `what-is-design-token.md` | ready / indexable | 真實正文（Design Token 說明） | 🟢 **是** | **納入首發**（intended candidate；唯一 advisory = cover placeholder） |
| 5 | `github-pages-build-preview-workflow.md` | published / indexable | 真實正文；已 `published` | 🟢 **是** | **保留**（already published；無需改動） |

（#3 `admin-ui-draft-generator-first-test.md` 已 `draft`，本就排除，不在 scope 討論；無風險。）

### 4.1 特別處理：#1 `github-pages-blog-planning`

- body 為初始化 scaffold 佔位文，但 `status: ready` → C1-D0 已判定會被 build 納入並（保持/成為）線上內容。
- 這是一篇**內容尚未撰寫**的佔位文，不應作為正式對外文章上線。
- **最小安全方案 = 改為 `draft`**（`status: ready → draft`、`draft: false → true`）：完全排除出 build / sitemap / listing，且語意正確（「內容未完成、暫存」）。
- 替代方案 `archived` 不建議：archived 語意是「退役文章」，此文從未有真實內容，非退役，`draft` 較貼切。
- **判定：🔴 建議改 `draft`（需 Dean 明確決策 + 手動執行；Claude 不自動 flip）。**

### 4.2 註 B：#2 `portable-blog-system-mvp` 保留 vs quarantine

- 內容為真實 Phase 1-A 範例正文（非 scaffold），且 `seo.indexing: noindex-follow` → **不進 sitemap、搜尋引擎不索引**，對外曝光已受限；`includeInListings: true` 為刻意設計（documented policy lock）。
- 它同時是 CLAUDE.md 記載之 SEO-1/SEO-2/SEO-3 測試樣本 + production 唯一 expected warning（`page-noindex-in-listings`）來源。
- **建議保留**（首次上線低風險：noindex 已限制搜尋曝光；listing 內出現屬刻意）。
- 若 Dean 想要「絕對最小 scope（首發只放 design-token）」，可將 #2 一併 quarantine 為 `draft`；但**副作用**：會使 production 唯一 expected warning 消失、post count 下降，`validate:content` baseline 隨之變動（屬預期，非錯誤）。此取捨留給 Dean。

---

## 5. 建議的第一次 deploy scope（彙總）

**Option A（推薦：最小安全，保留低風險真實內容）**

| 動作 | 文章 |
|---|---|
| ✅ 納入首發（不改 status） | #4 design-token（ready）、#5 preview-workflow（published）、#2 portable-blog-system-mvp（ready；noindex 保留） |
| 🔴 quarantine → `draft` | #1 github-pages-blog-planning（scaffold 佔位文） |
| （本就排除） | #3 admin-ui-draft-generator（已 draft） |

→ 首發上線 **3 篇**（#2 / #4 / #5），quarantine 1 篇（#1）。

**Option B（絕對最小：首發只放 design-token 相關）**

| 動作 | 文章 |
|---|---|
| ✅ 納入首發 | #4 design-token、#5 preview-workflow（already published） |
| 🔴 quarantine → `draft` | #1 github-pages-blog-planning、#2 portable-blog-system-mvp |

→ 首發上線 **2 篇**；但 #2 quarantine 會變動 validate baseline（見註 B），較不推薦除非 Dean 明確要極小 scope。

**推薦 = Option A**（符合保守落地：只 quarantine 明確有問題的 scaffold 佔位文，保留其餘真實/已發布內容；不動 validate baseline）。

---

## 6. 需要 Dean 明確決策的項目

| # | 決策 | 建議 | 誰執行 |
|---|---|---|---|
| 1 | #1 github-pages-blog-planning 是否改 `draft` | 🔴 **建議改 draft** | Dean 手動 flip |
| 2 | #2 portable-blog-system-mvp 保留或 quarantine | 🟡 **建議保留**（noindex 已限制曝光） | Dean 決定 |
| 3 | 採 Option A 還是 Option B | 🟢 **建議 Option A** | Dean 決定 |
| 4 | #4 design-token cover placeholder 是否換真實封面 | 🟡 建議、非強制（per C1-C0/D0） | Dean 內容決定 |
| 5 | 是否授權 build / deploy（本輪不做） | 🔴 需明確授權 | Dean |

---

## 7. 下一步若 Dean 批准，應改哪些 content status

**採 Option A 時，需手動修改的 content status（Claude 不自動 flip）**：

```text
content/github/posts/20260504-github-pages-blog-planning.md
  status: "ready"  →  "draft"
  draft: false     →  true
```

- 其餘 3 篇（#2 / #4 / #5）**無需改 status** 即為正確首發 scope。
- （可選）#4 design-token 換真實 cover + coverAlt。
- （可選、發布後 SOP）實際 deploy 完成後，Dean 可把首發文章 `ready → published`（per publish-workflow §10 status transition SOP；屬上線後語意回填，非上線前必要）。

**修改後建議（未來、非本輪）**：跑 `npm run validate:content` 確認 0 error（#1 轉 draft 後 post count / warning 數會變動，屬預期）。

---

## 8. 結論

- **建議第一次 deploy 納入**（Option A）：#2 portable-blog-system-mvp（noindex 保留）、#4 what-is-design-token、#5 github-pages-build-preview-workflow —— 共 **3 篇**。
- **應 quarantine**：#1 github-pages-blog-planning（scaffold 佔位文）→ 改 `draft`。
- **github-pages-blog-planning 是否建議改 draft**：🔴 **是，建議改 draft**（最小安全方案；語意正確；完全排除出 build/sitemap/listing）。
- **portable-blog-system-mvp 保留或 quarantine**：🟡 **建議保留**（真實內容 + noindex 已限制搜尋曝光 + 屬刻意 policy lock；quarantine 會變動 validate baseline，非必要）。
- **下一步（若 Dean 批准）**：只需手動把 #1 改 `draft`（`ready→draft` + `draft:true`）；其餘 3 篇 status 不動。
- **本輪明確未做**：無 build / deploy / preview / flip / gh-pages；deploy clone 未觸碰。

---

## 9. 本 phase 邊界（self-check）

- ✅ 唯一 file change：新增本檔 `docs/20260703-c1-e0-publish-scope-quarantine-plan.md`。
- ✅ 未改 `src/` / `views/` / `scripts/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- ✅ 未 flip 任何文章 status（#1 仍 `ready`；全部維持現況）。
- ✅ 未 build / preview / deploy / repost / gh-pages；deploy clone 未觸碰。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console；未 `npm install` / 動 dependency / lockfile。

---

## 10. Cross-links

- `docs/20260703-c1-d0-build-inclusion-inventory.md`（C1-D0；本文件之輸入）。
- `docs/20260703-c1-c0-build-readiness-audit.md`（C1-C0）。
- `docs/20260703-c1-b0-single-real-article-publish-checklist-dry-run.md`（C1-B0）。
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（C1 checklist §3 status contract）。
- `src/scripts/load-posts.js`（`VISIBLE_STATUS = {ready, published}`；draft/status 過濾）。
- `docs/publish-workflow.md` §10（status transition SOP）。
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（#2 noindex + in-listings policy lock）。

---

（本文件結束 / end of document）
