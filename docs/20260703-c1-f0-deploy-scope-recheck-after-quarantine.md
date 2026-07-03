# C1-F0 Deploy Scope Re-Check After Quarantine（docs-only）

- **Phase name**：`20260703-g-c1-f0-deploy-scope-recheck-after-quarantine-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-F` / C1-E1 quarantine）
- **Type**：**docs-only / read-only re-check**。**不**改 `content/` / `src/` / `content/settings/` / `CLAUDE.md`、**不** build、**不** preview、**不** deploy、**不**碰 gh-pages、**不**改 Blogger / GA4 / AdSense / Search Console、**不** `npm install` / dependency / lockfile。唯一 mutation = 新增本檔。

---

## 0. Critical disclaimers（read first）

1. **本輪沒有 build / preview / deploy / gh-pages。** 只 read-only 重新確認 quarantine 後的 deploy scope。
2. inclusion 結論由**讀 source frontmatter + loader/sitemap 邏輯推導**，**未實際跑 build**；未讀 `dist/`、未 fetch 內容、未 pull deploy clone 內容。
3. deploy clone（`portable-blog-deploy` / gh-pages）本輪僅 **read-only** fetch/rev-parse 驗證 baseline，**未進入、未 checkout、未寫入**。

---

## 1. Purpose

C1-E1（commit `94385b1`）已將 scaffold 佔位文 `github-pages-blog-planning` 從 `ready` 改為 `draft`。本文件重新盤點，確認：

- quarantine 是否生效（該篇是否已排除出 build / listing / sitemap）。
- 第一次 deploy scope 是否只剩預期 3 篇。
- `admin-ui-draft-generator-first-test` 是否仍為 draft 並排除。
- 是否仍有未預期上線風險。

---

## 2. Session-start baseline（2026-07-03, Asia/Taipei）

Source repo（`/d/github/blog-new/portable-blog-system`）：

```text
branch: main
HEAD = origin/main = 94385b1ff504012860bfd337d8e4a1f8254fbfd7
short: 94385b1
subject: content(github): quarantine scaffold planning draft
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
```

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；本輪僅 read-only 驗證）：

```text
branch: gh-pages
HEAD = origin/gh-pages = d0f37eb
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
```

Baseline **matched** on entry；deploy clone 未觸碰（僅 read-only fetch/rev-parse）。

---

## 3. Build inclusion 條件（carry-forward）

per C1-D0（`docs/20260703-c1-d0-build-inclusion-inventory.md`）+ `src/scripts/load-posts.js`：native github post 過濾只看 `draft` / `status`：

```text
draft === true  或  status ∉ { ready, published }  → 排除
否則                                                → 納入 build
```

sitemap 另有 precedence（`seo.indexing` explicit → download fallback → default include；noindex-* → exclude）。listing 讀 `includeInListings`。

---

## 4. Re-check：quarantine 後逐篇狀態

現況（read-only 重新讀取 frontmatter）：

| # | filename | status | draft | seo.indexing | build 納入? | sitemap? | listing? |
|---|---|---|---|---|---|---|---|
| 1 | `20260504-github-pages-blog-planning.md` | **`draft`** | **`true`** | （無） | ❌ **排除** | ❌ | ❌ |
| 2 | `20260504-portable-blog-system-mvp.md` | `ready` | `false` | `noindex-follow` | ✅ 納入 | ❌（noindex） | ✅（includeInListings:true） |
| 3 | `2026-06-29-admin-ui-draft-generator-first-test.md` | `draft` | `true` | （無） | ❌ **排除** | ❌ | ❌ |
| 4 | `2026-06-30-what-is-design-token.md` | `ready` | `false` | （無） | ✅ 納入 | ✅ | ✅ |
| 5 | `2026-07-01-github-pages-build-preview-workflow.md` | `published` | `false` | （無） | ✅ 納入 | ✅ | ✅ |

（`20260504-github-pages-blog-planning.fb.md` = FB sidecar，非文章本體，不參與 build。）

### 4.1 quarantine 生效確認（#1 github-pages-blog-planning）

- `status: "draft"` + `draft: true` → 命中 loader 排除條件（兩條件皆滿足；任一即排除）。
- 結果：**排除出 build**（不產生 `dist/posts/github-pages-blog-planning/`）、**排除出 sitemap**（未進 build 即無 entry）、**排除出 listing**（loader 過濾後不進 posts 集合）。
- ✅ **quarantine 生效**。

### 4.2 #3 admin-ui-draft-generator 仍排除

- `status: "draft"` + `draft: true`（自始未變）→ 仍被過濾。
- ✅ 仍排除，無變動。

---

## 5. 第一次 deploy scope（quarantine 後）

若現在 `npm run build`，納入 **3 篇**（與 C1-E0 Option A 一致）：

| # | 文章 | status | sitemap | listing |
|---|---|---|---|---|
| 2 | `portable-blog-system-mvp` | ready | ❌（noindex-follow） | ✅（in-listings，刻意） |
| 4 | `what-is-design-token` | ready | ✅ | ✅ |
| 5 | `github-pages-build-preview-workflow` | published | ✅ | ✅ |

**排除 2 篇**：#1 `github-pages-blog-planning`（已 quarantine → draft）、#3 `admin-ui-draft-generator-first-test`（本就 draft）。

→ ✅ **deploy scope 確定為預期 3 篇。**

---

## 6. 未預期上線風險 re-assessment

| 先前風險（C1-D0/E0） | quarantine 後現況 |
|---|---|
| #1 scaffold 佔位文 `ready` 會上線 | ✅ **已解除**（改 draft，完全排除） |
| build 一次帶 4 篇、無法只發單篇 | 🟢 現 scope = 3 篇，皆為真實內容 / 已發布 / noindex-limited；無佔位文混入 |
| #2 noindex + in-listings 不對稱 | 🟢 屬既有刻意 policy lock（documented），非新風險 |
| relative-to-live delta = UNKNOWN | 🟡 仍 UNKNOWN（不 build/不 fetch 內容無法確認哪些已 live）；非 blocker |

**結論：無未預期上線風險。** 現 scope 3 篇皆為 Dean-intended / 真實內容 / 已 published；佔位文風險已由 C1-E1 quarantine 解除。

---

## 7. 結論

- **quarantine 是否生效**：✅ 是。`github-pages-blog-planning` 已由 `ready` → `draft`（`draft: true`），完全排除出 build / sitemap / listing。
- **第一次 deploy scope 是否確定為 3 篇**：✅ 是 —— `portable-blog-system-mvp`（ready；noindex 保留）、`what-is-design-token`（ready）、`github-pages-build-preview-workflow`（published）。
- **`admin-ui-draft-generator-first-test` 是否仍 draft 並排除**：✅ 是，無變動。
- **是否仍有未預期上線風險**：🟢 無。佔位文風險已解除；其餘皆屬既有 documented 狀態。
- **本輪明確未做**：無 build / preview / deploy / gh-pages；deploy clone 未觸碰。

---

## 8. 下一步建議（不自動執行；各需 Dean 明確授權）

當前 deploy scope 已乾淨收斂為 3 篇。若 Dean 決定推進首次發布，建議順序（權威流程 `docs/github-deploy.md` §4–§5）：

1. （可選內容）design-token 換真實 cover + coverAlt（per C1-C0/D0 advisory）。
2. build readiness：`npm run validate:content`（預期 0 error）→ `npm run build`（含 postbuild sitemap auto-chain）。
3. `npm run preview` 本機 sanity check（檢查後關閉）。
4. deploy：先確認 deploy clone 狀態 → 依 github-deploy §5.4 增量更新 push gh-pages。
5. 上線後驗證：github-deploy §7 + `docs/checklists/github-deploy-checklist.md`。

⚠️ 以上每步（尤其 2/4）仍需 Dean 逐步明確授權；本 re-check **不代表任何預先放行**，Claude 不自動 build / preview / deploy。

---

## 9. 本 phase 邊界（self-check）

- ✅ 唯一 file change：新增本檔 `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`。
- ✅ 未改 `src/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`；未改任何文章 status。
- ✅ 未 build / preview / deploy / repost / gh-pages；未讀 `dist/`；deploy clone 未觸碰（僅 read-only fetch/rev-parse）。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console；未 `npm install` / 動 dependency / lockfile。
- ✅ smoke 未重跑（見 §10）。

---

## 10. Smoke 未重跑之理由

上一輪 C1-E1（commit `94385b1`，push 後乾淨同步工作區）剛通過完整驗證且 baseline 未再變動：

```text
npm run validate:content                     → 0 error / 135 warning / 107 post
npm run check:github-pages-prepublish-smoke  → 8/8 PASS
npm run check:github-pages-prepublish        → 16/16 PASS
```

本輪為純 read-only re-check、未觸碰 repo state（僅新增本 docs），boot verify 已確認 branch/HEAD/clean/ahead-behind/index.lock 皆符；故 smoke 不重跑（carry-forward 有效）。驗證改以 `git diff --check` + fence pairing。

---

## 11. Cross-links

- `docs/20260703-c1-e0-publish-scope-quarantine-plan.md`（C1-E0；Option A 決策依據）。
- `docs/20260703-c1-d0-build-inclusion-inventory.md`（C1-D0；quarantine 前 inventory）。
- `docs/20260703-c1-c0-build-readiness-audit.md` / `docs/20260703-c1-b0-single-real-article-publish-checklist-dry-run.md`（C1-C0 / C1-B0）。
- C1-E1 quarantine commit：`94385b1`（`content(github): quarantine scaffold planning draft`）。
- `src/scripts/load-posts.js`（`VISIBLE_STATUS = {ready, published}`；draft/status 過濾）+ `src/scripts/build-sitemap.js` §3。
- `docs/github-deploy.md` §4–§7（未來 build / deploy / 上線驗證流程）。

---

（本文件結束 / end of document）
