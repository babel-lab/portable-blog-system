# Release Readiness Contract — Baseline Verification（2026-07-07）

## 1. 目的

本 note 是 `docs/20260707-release-readiness-runbook.md` 於 `check:release-readiness-contract` 被併入 `check:release-readiness` 最前之後的**實跑 baseline evidence**。

前一份 `docs/20260707-release-readiness-clean-baseline-verification.md` 對應的是 baseline `9158ebf`（尚未含 contract guard）；本 note 對應 baseline `582f4c6`（contract guard 已 landed 並掛入 umbrella 第一步）。兩份 verification note 為時間軸上前後兩段，不衝突、不取代彼此。

本輪為 **docs-only 小切片**：只新增本檔 + 更新 runbook，未動 `package.json` / JS guards / npm script / content / frontmatter / metadata / CLAUDE.md。

## 2. Source baseline

- repo：`/d/github/blog-new/portable-blog-system`
- branch：`main`
- HEAD = origin/main：`582f4c611a3b6440cdb92c7b809650a3d8437dcc`
- short：`582f4c6`
- subject：`chore(publish): include release readiness contract`
- working tree：clean（本檔新增前）
- ahead/behind：`0 0`
- `.git/index.lock`：absent

## 3. `check:release-readiness` 實際 script（本 baseline）

```
npm run check:release-readiness-contract && npm run check:github-pages-prepublish && npm run check:github-pages-prepublish-smoke && npm run check:metadata-all && npm run validate:content
```

執行順序：

1. `check:release-readiness-contract`（meta-guard；只讀 package.json、不執行子腳本、不讀 deploy clone）
2. `check:github-pages-prepublish`（git-state / dual-repo fail-fast）
3. `check:github-pages-prepublish-smoke`（fixture 驅動 failure branch smoke）
4. `check:metadata-all`（8 guards，report-only / warning-only）
5. `validate:content`（error/warning/post 計數）

純 checks umbrella（Option A package.json 串接）：**contract meta-guard 在最前 → safety fail-fast → warning-only quality**。**只做 checks，無 build / deploy / push gh-pages / 動 dist。**

## 4. Contract guard 語意（本 baseline）

`check:release-readiness-contract` 的靜態斷言（詳 `src/scripts/check-release-readiness-contract.js`）：

- 只讀 `package.json`
- **不**執行 `check:release-readiness` 或其任何子腳本
- **不**啟動 dev server / build / deploy / fetch / pull
- **不**讀取 deploy clone（`/d/github/blog-new/portable-blog-deploy`）
- **不**碰 gh-pages / dist / 任何寫入
- 斷言 `scripts["check:release-readiness"]` 存在、非空、包含 4 個必要片段（prepublish / prepublish-smoke / metadata-all / validate:content），且不包含危險 token（`build` / `deploy` / `gh-pages` / `push` / `dist` / `portable-blog-deploy` / `publish`；`publish` 以 negative lookbehind 排除合法 `prepublish` 子字串）

Contract guard PASS 只代表 umbrella 契約未被誤破壞，**不代表**已發布、**不**觸發任何實際 build / deploy。

## 5. 本輪實際驗證結果（2026-07-07 clean tree，baseline `582f4c6`）

| 指令 | 結果 |
| --- | --- |
| `check:release-readiness-contract` | **13/13 PASS**（1 parseable + 1 script-present + 4 required fragments + 7 forbidden tokens absent） |
| `check:release-readiness` | exit 0（全鏈通過，contract 先於 prepublish 執行） |
| `check:github-pages-prepublish` | **16/16 PASS**（total=16 pass=16 fail=0） |
| `check:github-pages-prepublish-smoke` | **8/8 PASS** |
| `check:metadata-all` | 8 metadata guards **exit 0**；production scanned 17 / candidates 0 / warnings 0 |
| `validate:content` | **0 error / 135 warning / 107 post** |
| `check:npm-script-targets` | **47/47 PASS** |
| `git diff --check` | clean |

### 5.1 contract guard 明細（13/13）

- package.json parseable ✅
- `scripts["check:release-readiness"]` exists and non-empty ✅
- required fragment `npm run check:github-pages-prepublish` present ✅
- required fragment `npm run check:github-pages-prepublish-smoke` present ✅
- required fragment `npm run check:metadata-all` present ✅
- required fragment `npm run validate:content` present ✅
- forbidden token `build` absent ✅
- forbidden token `deploy` absent ✅
- forbidden token `gh-pages` absent ✅
- forbidden token `push` absent ✅
- forbidden token `dist` absent ✅
- forbidden token `portable-blog-deploy` absent ✅
- forbidden token `publish` absent（負面 lookbehind 排除合法 `prepublish` 子字串）✅

### 5.2 其餘子檢查明細

- prepublish 16/16：source dir/git/branch=main/clean/HEAD==origin/main/ahead-behind 0-0/index.lock absent/2 required docs + deploy dir/git/branch=gh-pages/clean/HEAD==origin/gh-pages/ahead-behind 0-0/index.lock absent。
- prepublish smoke 8/8：happy-path / missing-deploy-clone / deploy-wrong-branch / source-dirty / missing-required-docs / source-ahead-of-remote / source-index-lock-present / deploy-index-lock-present。
- metadata-all 8 guards：single-field 5（content-type / adsense-mode / campaign-purpose / campaign-industry / custom-promo；production scanned 17，全 legacy，warnings 0）+ cross-field 3（campaign-metadata / custom-promo / adsense；candidates 0，warnings 0）。

## 6. deploy clone / gh-pages 說明

- 本輪**沒有手動讀取、cd、或修改** deploy clone（`/d/github/blog-new/portable-blog-deploy`）。
- 唯一觸及 deploy clone 的路徑，是 `check:release-readiness` umbrella 中的 `check:github-pages-prepublish` 子檢查所**固有 read-only** 檢查（branch / clean / HEAD == origin/gh-pages / index.lock）——此為指令設計行為，非本輪額外動作。
- `check:release-readiness-contract` 本身**完全不接觸** deploy clone。
- 本輪**沒有** build、deploy、push gh-pages。

## 7. 本輪未做（紀律確認）

- 不新增 npm script、不修改 `package.json`
- 不修改任何 JS guard（含 `check-release-readiness-contract.js`）
- 不修改 content / frontmatter、不回填 metadata
- 不修 validation warnings（135 warning 全來自 `content/validation-fixtures/` 及 1 個 production intentional download listing hold）
- 不猜 Blogger URL / postId / publishedAt
- 不修改 `CLAUDE.md`、不大規模 refactor、不新增 metadata rule、不啟動下一 slice
