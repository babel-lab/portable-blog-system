# release-readiness docs index / discoverability note（2026-07-07）

docs-only discoverability index。把 release-readiness 相關 docs 集中列出，讓未來查詢時可快速定位到正確一份，而不必先靠 filename convention 反推。

本輪**不**改 package script、**不**改任何 guard、**不**動 content/frontmatter、**不** deploy、**不**碰 gh-pages / deploy clone、**不**執行 `check:release-readiness`（其 prepublish 子檢查固有讀取 deploy clone）。

---

## 0. Frozen baseline（撰寫時）

- source repo：`/d/github/blog-new/portable-blog-system`
- branch：`main`
- HEAD == origin/main == `5e61ad6`（subject `docs(publish): align release readiness contract docs`）
- ahead/behind = `0 0`、working tree clean、`.git/index.lock` absent
- deploy clone `/d/github/blog-new/portable-blog-deploy`（gh-pages）本輪**未碰、未讀取**

---

## 1. release-readiness docs 清單

按建議閱讀順序排列：

| # | 檔案 | 定位 |
| --- | --- | --- |
| 1 | `docs/20260707-metadata-all-prepublish-integration-audit.md` | **設計脈絡先讀**。記錄當初為何**不**把 `check:metadata-all`（report-only / warning-only）直接塞進 `check:github-pages-prepublish` 這支 fail-fast prepublish guard；改採獨立 umbrella 串接以維持「fail-fast safety」與「report-only quality」語意分離。§3/§6 為後續 umbrella 之提案。 |
| 2 | `docs/20260707-release-readiness-runbook.md` | **使用說明 / 指令分工**。umbrella 定位、實際 script 內容、5 支子檢查分工表、metadata suite 內部再分工（`metadata-guards` = 5 single-field / `metadata-cross-fields` = 3 cross-field）、baseline、使用時機、非目標、注意事項。原始 baseline `b5c45d0`，於 `582f4c6` 把 `check:release-readiness-contract` 併入 umbrella 最前後對齊。 |
| 3 | `docs/20260707-release-readiness-clean-baseline-verification.md` | **contract guard 併入前** clean tree baseline evidence（umbrella 首次 landing 之驗證證據）。 |
| 4 | `docs/20260707-release-readiness-contract-baseline-verification.md` | **contract guard 併入後** baseline evidence（`check:release-readiness-contract` 併入 umbrella 最前之後的完整 baseline 驗證）。 |

本 index（`docs/20260707-release-readiness-docs-index.md`）本身不記錄 baseline 數值，只做指路；數值請以上述 runbook / verification 二份為準。

---

## 2. 目前正式入口

```
npm run check:release-readiness
```

它是 **top-level release readiness umbrella**（checks-only），跑完 exit 0 **不代表**已發布，只代表 repo 通過既有 read-only 檢查。

---

## 3. 目前 script 結構

`check:release-readiness` = 5 支子檢查串接（純 `npm run` 串接，Option A 風格；umbrella 本身未新增任何 `.js`）：

1. `check:release-readiness-contract` — umbrella 自身「checks-only」契約 meta-guard（只讀 `package.json`；不執行子腳本、不讀 deploy clone、不 build/deploy）
2. `check:github-pages-prepublish` — git-state / dual-repo deploy-safety fail-fast guard
3. `check:github-pages-prepublish-smoke` — prepublish failure-branch smoke（fixture env override）
4. `check:metadata-all` — content metadata quality suite（report-only / warning-only / exit 0）
5. `validate:content` — content validation baseline（error/warning/post 計數）

排序刻意如下：**contract meta-guard 最前**（umbrella 誤改成含 build/deploy 立刻擋）→ **safety fail-fast**（repo state 不安全立刻擋）→ **warning-only quality 在後**（不阻擋，只報數）。

---

## 4. `check:metadata-all` 分工

```
check:metadata-all = check:metadata-guards && check:metadata-cross-fields
```

- `check:metadata-guards`：**5 個 single-field guard**（content-type / adsense-mode / campaign-purpose / campaign-industry / custom-promo）
- `check:metadata-cross-fields`：**3 個 cross-field guard**（campaign-metadata / custom-promo / adsense 內部一致性）

`check:metadata-all` 是 **metadata suite**，**不等於** release-readiness 全套（release-readiness 另含 contract meta-guard + prepublish safety + smoke + content validation）。

---

## 5. Red lines（跑 `check:release-readiness` 不會、也不應由它衍生）

- `check:release-readiness` 是 **checks-only umbrella**
- **不** build
- **不** deploy
- **不** push gh-pages
- **不**修改 content / frontmatter
- **不**回填 metadata
- **不**猜 Blogger URL / Blogger postId / Blogger publishedAt

Umbrella 本身若被誤改成含 `build` / `deploy` / `gh-pages` / `push` / `dist` / `portable-blog-deploy` / `publish`（合法 `prepublish` 除外）等 token，`check:release-readiness-contract` 會 fail-fast 攔下（詳 runbook §7.4）。

---

## 6. 後續擴充規則

若未來要在此 umbrella 加入 **build / deploy 前置檢查**：

1. 需**另開 phase**
2. 需 **explicit approval**
3. **不得**直接改現有 release-readiness 語意（不得在 umbrella 直接塞入 build/deploy 步驟；會破壞「只做 checks」的語意分離，並被 contract guard 立刻擋下）
4. 若要合法擴充 umbrella 的必要子檢查，須**同步**更新 `REQUIRED_FRAGMENTS`（見 `src/scripts/check-release-readiness-contract.js`）

---

## 7. 非目標（本 index 不做）

- 不重複記錄 baseline 數值（以 runbook / verification 二份為準）
- 不新增 script、不改 guard、不改 content/frontmatter、不改 `CLAUDE.md`
- 不執行 `check:release-readiness`（其 prepublish 子檢查固有讀取 deploy clone；本輪只是 docs index，不需觸發 deploy-clone 讀取）
- 不 deploy、不 build gh-pages、不碰 deploy clone
