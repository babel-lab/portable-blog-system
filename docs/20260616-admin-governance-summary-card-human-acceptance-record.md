# ADMIN — Governance Summary Card Human Acceptance Record

- **Phase**：`20260616-admin-governance-summary-card-human-acceptance-docs-only-a`
- **日期**：2026-06-16（12:30 起；pm session）
- **性質**：docs-only human acceptance record（**不**做任何 source implementation；**不**改 src / views / scripts / loader / validator / content / settings / tags.json / categories.json / 任何 frontmatter / markdown；**不**新增 Apply / Save / Auto-fix / Write / Mutate；**不** npm install / build / deploy / Blogger repost）
- **承接**：
  - `docs/20260616-admin-governance-summary-card-implementation-record.md`（am-4 實作；`63ffbf3 feat(admin): add read-only governance summary card`）
  - `docs/20260616-admin-governance-summary-card-preanalysis.md`（am-3；Option B 位置 / 主軸 net-new rollup / post-level mismatch / same-source 註 / UI 紅線 / acceptance criteria）

---

## A. Phase name

`20260616-admin-governance-summary-card-human-acceptance-docs-only-a`

---

## B. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 63ffbf3ec9fe7f42d2d1bf2883236ac49641ed4f == origin/main
working tree   : clean
last subject   : feat(admin): add read-only governance summary card
ahead / behind : 0 / 0
```

→ baseline 完全符合 phase 指示（HEAD == origin/main == `63ffbf3`、clean tree、預期 subject）。未執行任何 merge / rebase / reset / amend / force push。

---

## C. Files read（read-only）

- `docs/20260616-admin-governance-summary-card-implementation-record.md`（am-4 implementation record；本 acceptance 之引用依據，含 D §渲染卡片數值與 F §validation results）
- `docs/20260616-admin-suggested-fix-l2-readonly-ui-human-acceptance-record.md`（前一份 acceptance record；格式參照）
- `CLAUDE.md`（ledger 現況確認）

本階段**未**重跑 `validate:content` 或任何 `check:*` smoke —— acceptance 性質為記錄人眼目視結果，am-4 implementation record 已含 validation results（`validate:content` 0/94/84、4 個 check carry-forward、`check:blogger-adsense-output` 85/0 by construction 不受影響），baseline git 狀態亦已確認，無需重跑。

---

## D. Files changed

- `docs/20260616-admin-governance-summary-card-human-acceptance-record.md`（本檔，新增）
- `CLAUDE.md`（極小 ledger sync）

→ **0 個 source / view / script / loader / validator / content / settings / frontmatter 變更。**

---

## E. Human acceptance summary

使用者已於 **dev mode** 手動目視檢查 `/admin/#categories`（Categories & Tags section），驗收結果：

1. `/admin/#categories` 可正常載入。
2. Governance summary card 已出現在 `Categories & Tags` section 開頭附近（位於既有 governance aside 之後、registry surface-grid 之前，符合 Option B 規劃）。
3. Card 標題為「**內容治理摘要 / Governance summary**」，並顯示「**read-only · derived**」標示。
4. 數值顯示符合 am-4 implementation record（F §渲染卡片數值）之預期：
   - **11** 篇文章檢視（含 draft）
   - **1** 篇有治理訊號
   - **1** 治理訊號總數
   - **0** 篇 cross-site mismatch · tag
   - **0** 篇 cross-site mismatch · category
   - 其中 **1** 篇含 unknown tag、**0** 篇 unknown category
5. `Unknown tag usage` 區塊顯示 `download unknown`，對應 `phonics-practice-sheet-download`，與 implementation record（unknownTagCount=1；tag `download` 未在 tags.json）回報一致。
6. 未見明顯破版。
7. 未見 Apply / Save / Auto-fix / Write / Mutate 類按鈕或寫入暗示。
8. 文案有標示 read-only，並說明 governance signals 為人工眼提示、非 build blocker。
9. 目前沒有明顯重複統計困惑；summary card（post-level rollup）與下方 per-category / per-tag usage 明細（key-level totals）可互相對照。

**Verdict：PASS（human-accepted）。**

### Caveats（誠實標示）

- 本驗收為 **manual visual acceptance**（人眼於 dev mode 目視 `/admin/#categories`），**非** automated UI snapshot / DOM assertion 涵蓋。
- 數值正確性以 am-4 implementation record 之 source-derived 結果為準（dev admin render「11 posts」、`tagUsage: 7 defined / 1 unknown`）；本 acceptance 確認 card 顯示與該結果一致、無破版、無寫入誤導，**未**逐 post / 逐欄重新獨立核算。
- 唯一治理訊號 post = `phonics-practice-sheet-download`（sourceSite=blogger、tag `download` 未在 tags.json → unknownTagCount=1）為真實且正確之治理訊號，與 L2 read-only UI human acceptance（am-2）一致。

---

## F. No-source-change confirmation

- ❌ **未**改 `src/` 任何檔（含 `src/views/admin/index.ejs` / `load-admin-posts.js` loader / `validate-content.js` validator / scripts）
- ❌ **未**改 `content/` 任何檔 / frontmatter / markdown
- ❌ **未**改 `content/settings/tags.json` / `categories.json` / 任何 settings
- ❌ **未**新增 Apply / Save / Auto-fix / Write / Mutate 行為
- ❌ **未** `npm install` / 未動 `package.json` / lockfile
- ❌ **未** build prod / deploy / push gh-pages / 重貼 Blogger
- ❌ **未**動 GA4 / AdSense / commerce 後台
- ❌ **未** amend / rebase / reset / force push / unrelated cleanup
- ✅ mutation 僅 = 本 record doc + CLAUDE.md 極小 ledger sync（docs-only）

---

## G. Recommended next phase（保守建議）

- `20260616-admin-validator-per-post-aggregation-preanalysis-docs-only-a`（per-post validator warning count aggregation preanalysis；docs-only；評估 detail panel 是否補逐篇 validator warning 計數）
- 並行不衝突：切片 5 empty-state 文字審稿（逐字文案一致性，低風險，docs-only）。
- **紅線提醒**：Dashboard pill / governance filter chip / 點數字跳轉篩選 / loader 聚合搬遷 / write path / per-post prescription 一律須獨立 phase + user explicit approval；不跳階。

---

（本紀錄結束）
