# 2026-05-25 PC 接手 baseline 確認

> Phase: `20260525-am-1-pc-handoff-report-a`
> 模式：docs-only

## 1. 日期與背景

- 時間：2026-05-25 09:32
- 事件：NB 專案檔拷貝至 PC 後首次確認
- 目的：在 PC 端進入任何後續開發 / build / deploy 工作前，先 read-only 確認 NB → PC 接手是否安全、source repo 是否與 origin 對齊、無遺留未提交變更。

## 2. Source repo baseline

| 項目 | 值 |
|------|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `dcb09392eff965223bfee77c40729dd47fb9957c` |
| origin/main | `dcb09392eff965223bfee77c40729dd47fb9957c` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| remote | `https://github.com/babel-lab/portable-blog-system.git`（fetch / push 同址） |

`git status --short --branch` 輸出：

```
## main...origin/main
```

（`##` 後無任何 modified / staged / untracked 條目。）

`git rev-list --left-right --count origin/main...HEAD`：

```
0	0
```

`git worktree list`：

```
D:/github/blog-new/portable-blog-system  dcb0939 [main]
```

唯一 worktree，無額外 detached worktree。

## 3. 最新 commit 對齊狀態

| 項目 | 值 |
|------|---|
| 預期最新 commit | `dcb0939` |
| 實際 HEAD short hash | `dcb0939` |
| 實際 HEAD full hash | `dcb09392eff965223bfee77c40729dd47fb9957c` |
| 對齊 | ✅ 一致 |

`git log --oneline -5`：

```
dcb0939 docs(report): add 5/24 docs trail and cross-reference map
7bdfb3a docs(index): cross-link blogger github publishing runbook
0b62a13 docs(runbook): add blogger github publishing and reverse utm runbook
72ee459 docs(reverse-utm): add 20260524 fixture readiness addendum
0a23bf8 docs(report): add am-8 docs-only follow-up addendum to 20260524 eod report
```

最新 5 commits 皆為 5/24 docs-only trail，與 5/24 EOD 報告所述一致；無 NB 端遺留之未 push commit。

## 4. node / npm / package 狀態

| 項目 | 狀態 |
|------|------|
| `package.json` | 存在 |
| `package-lock.json` | 存在 |
| `node_modules/` | 存在（top-level 66 項） |
| `npm install` 是否執行 | ❌ 未執行；本 phase 不執行 |

備註：

- `node_modules/` 已在；NB 拷貝時即帶過來，或 PC 端先前已 install。
- 本次未以 `npm ci --dry-run` 或 `npm ls` 驗證 lockfile / installed tree 完整性 — 留待後續若需要 build 時再驗。
- 依 baseline 確認規則：除非 `node_modules` 缺失或 user 明確要求，否則本階段不執行 `npm install`。

## 5. deploy repo / gh-pages 檢查結果

| 項目 | 狀態 |
|------|------|
| repo root `gh-pages/` 子資料夾 | ❌ 不存在 |
| repo root `deploy/` 子資料夾 | ❌ 不存在 |
| repo root `dist-deploy/` 子資料夾 | ❌ 不存在 |
| `git worktree list` 額外 deploy worktree | ❌ 無 |

結論：

- 本機 PC 端目前無 deploy worktree 或 deploy 子 repo。
- 此狀態與 pm-26 deploy verify 階段啟動前的 dormant 預期一致 — pm-24a/b/c reverse UTM source 已 push origin/main 但 live dormant，尚未 deploy、尚未重貼 Blogger 後台（per `CLAUDE.md §16.4` Blogger → GitHub Pages 段、`docs/20260524-eod-report.md`、`docs/20260524-blogger-github-publishing-runbook.md`）。

## 6. 本次 session 邊界

本 session 嚴格 docs-only：

- ❌ 不 build（不執行 `npm run build` / `build:github` / `build:blogger` / `build:promotion` / 任何 `vite` 指令）
- ❌ 不 deploy（不動 `dist-*` 任何輸出；不碰 gh-pages worktree；不重貼 Blogger）
- ❌ 不改 `src/`（views / styles / js / scripts 皆不動）
- ❌ 不改 `content/`（settings / posts / pages / templates 皆不動）
- ❌ 不碰 Blogger 發文流程
- ❌ 不執行 `npm install` / `npm ci` / `npm update`
- ❌ 不 commit / 不 push（本 baseline 文件完成後仍待 user 決定是否 commit）

允許範圍：

- ✅ 新增 / 編輯 `docs/` 文件（本檔即為本 phase 唯一變更）

## 7. 下一步候選

下列為候選方向，未排序、未承諾、未啟動，待 user 決定優先順序與是否仍維持 docs-only 模式：

- **Phase 1 usability review** — 重新檢視 Phase 1 GitHub 站本機 dev 可用性、列表 / 文章 / 分類 / 標籤 / 404 / Design System 頁面之 user-facing 體驗。
- **Blogger repost workflow dry-run** — 依 `docs/20260524-blogger-repost-checklist.md` / `docs/20260524-blogger-github-publishing-runbook.md` 做一次乾跑（不實際重貼 Blogger 後台），檢驗流程 doc 與當前 `dist-blogger/` 輸出是否一致。
- **GA4 / UTM click tracking validation** — 依 `docs/20260522-ga4-click-tracking-manual-validation.md` / `docs/20260524-ga4-reverse-utm-observation.md` 做一次 click tracking validation；含 GitHub → Blogger 正向（production live）與 Blogger → GitHub 反向（pm-24 source live dormant）兩方向 UTM 規則之手動驗證。
- **Admin / content editing workflow review** — 重新檢視 `docs/20260521-admin-overview-display-audit.md` / `docs/20260522-night-admin-usability-report.md` 所列 admin / content editing 工作流之現況與未完成項。
- **Custom domain 前置盤點** — 為未來 GitHub Pages 綁自訂網域做前置文件盤點（DNS、`CNAME`、canonical URL 策略影響、Blogger ↔ GitHub UTM 規則是否需修等）。

## 8. 接手結論

PC 端 portable-blog-system **clean 接手成功**，無 blocker：

- HEAD ≡ origin/main ≡ `dcb0939`
- working tree clean、無 ahead / behind
- node_modules 已就緒（本 phase 不驗證完整性）
- 無 deploy worktree、無 dormant build artifacts in repo root

可在 user 決定下一步候選後安全進入後續工作。
