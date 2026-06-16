# ADMIN — Validator Per-Post Aggregation Preanalysis Acceptance Record

- **Phase**：`20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-docs-only-a`
- **日期**：2026-06-16（12:51 起；pm session）
- **性質**：docs-only acceptance record（**不**做任何 source implementation；**不**改 src / views / scripts / loader / validator / content / settings / tags.json / categories.json / 任何 frontmatter·markdown；**不**新增 Apply / Save / Auto-fix / Write / Mutate；**不**新增 validator JSON output；**不**新增 reporter script；**不**改 ADMIN UI；**不** npm install / build / deploy / Blogger repost）
- **承接**：`docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2；`de36a0a docs(admin): add validator per-post aggregation preanalysis`）

---

## A. Phase name

`20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-docs-only-a`

---

## B. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : de36a0ab077083ec3044d2ab1f04e55c99c88c6f == origin/main
working tree   : clean
last subject   : docs(admin): add validator per-post aggregation preanalysis
ahead / behind : 0 / 0
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## C. Files read（read-only）

- `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2 preanalysis；本 acceptance 之引用依據）
- `CLAUDE.md`（ledger 現況確認）

本階段**未**重跑 `validate:content` 或任何 `check:*` smoke —— acceptance 性質為記錄決策接受；pm-2 preanalysis 為 read-only 盤點（source-grounded，已含 baseline `validate:content` 0/94/84 carry），baseline git 狀態亦已確認，無需重跑。

---

## D. Files changed

- `docs/20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-record.md`（本檔，新增）
- `CLAUDE.md`（極小 ledger sync）

→ **0 個 source / view / script / loader / validator / content / settings / frontmatter 變更。**

---

## E. Acceptance summary

接受 `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2）之盤點、選項分析與推薦。該 preanalysis：
- 完整盤點 validator ~110 rule-type（post-level / settings-level / cross-post 三層）；
- 確認 `validateContent()` 已 export 回傳結構化 `issues[]`，但 CLI main 只 `printIssues` stderr、**無** JSON 輸出；
- 確認 admin governanceSignals 僅 mirror 4 條 taxonomy 概念，非計數 mirror，未涵蓋其餘 ~106 rule-type；
- 比較 Option A/B/C/D，推薦現階段維持 C+D 現狀，未來若推進則 A2 優於 B；
- 排定 UI 位置優先序（detail panel > System checks > Posts index badge > summary card）；
- 鎖定安全紅線（read-only / 不 prescription / validator = ground truth）。

**Verdict：ACCEPTED（preanalysis 接受）。**

---

## F. Decision / deferred items

本階段**正式記錄之決策**：

1. **暫不實作** validator per-post warning aggregation。
2. **暫不**把 validator warnings 接到 ADMIN UI。
3. **維持 Option C + D 現狀**：
   - validator CLI（`npm run validate:content`）仍為 **ground truth**；
   - ADMIN 目前只顯示既有 `governanceSignals` / governance summary card（taxonomy triage，含 draft）；
   - ADMIN **不取代** validator。
4. **接受 preanalysis 之核心發現**：
   - validator universe 與 admin universe **不一致**；
   - validator 目前**只掃 ready / published**，draft / archived 被 `load-posts.js` 過濾（source L2106）；
   - ADMIN loader 掃**全文章含 draft**（11 篇 production，排除 fixtures，用絕對路徑）；
   - 目前唯一 governance signal 的 `phonics-practice-sheet-download` 是 **draft**，因此 validator 看不到（production validator warnings = **0**）；
   - draft **不應**被誤顯示為 `0 warnings`，應視為「**未驗證**」或 deferred。
5. **未來若要推進**，**必須先做** `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（docs-only；鎖 JSON schema + cross-loader join 契約 + class 對映 + staleness 模型），**而非**直接 implementation。

**Deferred（未在本線啟動，各須獨立 phase + user explicit approval）**：
- validation report JSON schema + join contract preanalysis（前置）；
- read-only reporter script（Option A2；不改 validator rule）；
- admin detail-panel 只讀消費 + staleness banner；
- System checks mirror / Posts index 計數 badge / summary card 補欄。

---

## G. Safety / docs-only confirmation

- ❌ **未**改 `src/`（含 `src/views/admin/index.ejs` / `load-admin-posts.js` loader / `validate-content.js` validator / scripts）
- ❌ **未**改 `content/` / frontmatter / markdown
- ❌ **未**改 `content/settings/tags.json` / `categories.json` / 任何 settings
- ❌ **未**新增 Apply / Save / Auto-fix / Write / Mutate
- ❌ **未**新增 validator JSON output
- ❌ **未**新增 reporter script
- ❌ **未**改 ADMIN UI
- ❌ **未** `npm install` / 未動 `package.json` / lockfile
- ❌ **未** build / deploy / push gh-pages / 重貼 Blogger
- ❌ **未** amend / rebase / reset / force push / unrelated cleanup
- ✅ mutation 僅 = 本 acceptance record doc + CLAUDE.md 極小 ledger sync（docs-only）

---

## H. Validation baseline（carry-forward；未重跑）

- `validate:content`：0 errors / 94 warnings / 84 issue-posts（normal baseline；production-post warnings = 0）
- `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0 · `check:blogger-adsense-output` 85/0 · `check-commerce-affiliate-resolver` 23/0（carry）

---

## I. Recommended next phase（保守建議）

- **idle freeze / exit**（最保守；ADMIN governance 線已收尾於穩定現狀，validator per-post 線正式 deferred）。
- 或 `20260616-admin-empty-state-copy-review-docs-only-a`（切片 5 empty-state 逐字文案審稿；低風險 docs-only；並行不衝突）。
- **紅線提醒**：validator JSON output / reporter script / admin-consume / summary-card 補欄 / Posts-index 計數 badge / write path / per-post prescription 一律須獨立 phase + user explicit approval；不跳階。未來推進前置 = `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`。

---

（本紀錄結束）
