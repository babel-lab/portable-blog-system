# Release Readiness — Clean Baseline Verification（2026-07-07）

## 1. 目的

本 note 是 `docs/20260707-release-readiness-runbook.md` 的**實際 baseline evidence**。

在 clean working tree 上實跑 `check:release-readiness` 及相關檢查，確認整條 release-readiness umbrella 可完整通過（exit 0），並逐一記錄各子檢查的實際數值，作為 runbook 的可追溯佐證。

本輪為 **docs-only 小切片**：只新增本檔一份 verification note，未動 `package.json` / JS guards / npm script / content / frontmatter / metadata / CLAUDE.md。

## 2. Source baseline

- repo：`/d/github/blog-new/portable-blog-system`
- branch：`main`
- HEAD = origin/main：`9158ebf749a483b521198cf7da8f7cb8d9357f2a`
- short：`9158ebf`
- subject：`docs(publish): add release readiness runbook`
- working tree：clean（本檔新增前）
- ahead/behind：`0 0`
- `.git/index.lock`：absent

## 3. `check:release-readiness` 實際 script

```
npm run check:github-pages-prepublish && npm run check:github-pages-prepublish-smoke && npm run check:metadata-all && npm run validate:content
```

純 checks umbrella（Option A package.json 串接）：safety fail-fast（prepublish → smoke）在前、warning-only quality（metadata-all → validate:content）在後。**只做 checks，無 build / deploy / push gh-pages / 動 dist。**

## 4. 本輪實際驗證結果（2026-07-07 clean tree）

| 指令 | 結果 |
| --- | --- |
| `check:release-readiness` | exit 0（全鏈通過） |
| `check:github-pages-prepublish` | **16/16 PASS**（total=16 pass=16 fail=0） |
| `check:github-pages-prepublish-smoke` | **8/8 PASS** |
| `check:metadata-all` | 8 metadata guards **exit 0**；production scanned 17 / candidates 0 / warnings 0 |
| `validate:content` | **0 error / 135 warning / 107 post** |
| `check:npm-script-targets` | **46/46 PASS**（45 script .js targets scanned） |
| `git diff --check` | clean |

### 4.1 prepublish 子檢查明細（16/16）

- source：dir exists / is git repo / branch == main / working tree clean / HEAD == origin/main（sha=9158ebf）/ ahead-behind 0/0 / `.git/index.lock` absent / required doc ×2 present
- deploy：dir exists / is git repo / branch == gh-pages / working tree clean / HEAD == origin/gh-pages（sha=1170e7e）/ ahead-behind 0/0 / `.git/index.lock` absent

### 4.2 prepublish smoke 子檢查明細（8/8）

happy-path（exit 0 summary 16/16）/ missing-deploy-clone / deploy-wrong-branch / source-dirty / missing-required-docs / source-ahead-of-remote / source-index-lock-present / deploy-index-lock-present —— 皆 flagged 正確。

### 4.3 metadata-all 子檢查明細（8 guards exit 0）

`check:metadata-all` = `check:metadata-guards`（5 single-field）+ `check:metadata-cross-fields`（3 cross-field）：

- single-field：content-type / adsense-mode / campaign-purpose / campaign-industry / custom-promo —— production scanned 17，全 legacy，warnings 0
- cross-field：campaign-metadata / custom-promo / adsense —— candidates 0，total warnings 0

全數 report-only / warning-only、不阻擋 build、exit 0。

## 5. deploy clone / gh-pages 說明

- 本輪**沒有手動讀取、cd、或修改** deploy clone（`/d/github/blog-new/portable-blog-deploy`）。
- `check:release-readiness` 內的 `check:github-pages-prepublish` 子檢查會**固有 read-only** 檢查 deploy clone 狀態（branch / clean / HEAD == origin/gh-pages / index.lock），此為指令設計行為、非本輪額外動作。
- 本輪**沒有** build、deploy、push gh-pages。
- deploy clone baseline：branch `gh-pages`、HEAD = origin/gh-pages = `1170e7e`、clean、ahead/behind 0/0。

## 6. 本輪未做（紀律確認）

- 不新增 npm script、不修改 `package.json`
- 不修改任何 JS guard
- 不修改 content / frontmatter、不回填 metadata
- 不修 validation warnings（135 warning 全來自 `content/validation-fixtures/` 及 1 個 production intentional download listing hold）
- 不猜 Blogger URL / postId / publishedAt
- 不修改 `CLAUDE.md`、不大規模 refactor、不新增 metadata rule、不啟動下一 slice
