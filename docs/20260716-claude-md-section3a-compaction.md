# CLAUDE.md §3a compaction — moved historical detail（2026-07-16）

> **Historical / supporting context.**
> **Not the boot contract.**
> **Current repository state must be verified from Git and current guards.**

本檔保存 2026-07-16 compaction 從 `CLAUDE.md` §3a 移出的較長歷史／metadata-guard 細節。移出目的：§3a 於 compaction 前為 39799 字元（size target `wc -m` < 40000），已無 headroom 記錄現行 redraft write-path 狀態。

**閱讀規則**：本檔所有數值、baseline、guard 計數皆為**當時量測**，不得當作現行狀態；現行狀態一律以 Git 指令與現行 guard 實跑輸出為準。本檔**不**新增 roadmap、**不**新增待辦、**不**複製可由 `git log` 直接取得之 commit 清單。

---

## 1. Superseded frozen baseline（2026-07-07；已被 §3a 現行 baseline 取代）

compaction 前 §3a 宣告之 frozen baseline：

- source HEAD = origin/main = `aefc3d9`（subject `test(content): guard custom promo metadata`）
- prior baseline = `8e5c490`（subject `docs(state): sync blogger backfill write-target baseline`）

**此 baseline 已 stale**（落後現行 origin/main 9 天）。現行 frozen baseline 見 `CLAUDE.md` §3a；新 Session 仍須依 §3a Core operating rules 自行以 Git 重新驗證，不得直接引用本節。

---

## 2. Report-only metadata guards 落地細節（2026-07-06→07）

當時新增之 additive report-only metadata guards，各為 standalone / warning-only / exit 0；僅動 `package.json` script 註冊 + 新增 `src/scripts/check-*.js`；**未**動 build / deploy / content / frontmatter / 既有 guard 語意：

- `check:content-type-metadata`
- `check:adsense-mode-metadata`
- `check:campaign-purpose-metadata`
- `check:campaign-industry-metadata`
- `check:custom-promo-metadata`（掃 `ads.customPromoBlocks` 型別；當時量測 scanned 17 / legacy 17 / candidates 0 / warnings 0）

當時 `check:npm-script-targets` = 43/43（**已 superseded**；2026-07-16 實跑為 109/109）。上述 guard 之 umbrella 關係（`check:metadata-guards` / `check:metadata-cross-fields` / `check:metadata-all` / `check:release-readiness`）現況以 `package.json` 為準。

**紅線（仍有效，非歷史）**：report-only guard 不得逕行升級為 fail-fast；升級須另開 phase + explicit approval。

---

## 3. Blogger identity / backfill 當時 baseline

當時 docs-only slice 落地之 policy（policy 本身仍有效；數值為當時量測）：

- `docs/20260706-blogger-identity-and-backfill-strategy.md`：Blogger identity 分層 policy —— `bloggerPostId` 等 internal ID 屬系統欄位，待未來 Blogger API flow 取得，**不**列為 Dean 人工 backfill 必填（Dean 只能提供 title / publishedUrl / publishedAt / note）；**不猜** ID；GitHub date 與 Blogger `publishedAt` mismatch 非錯誤。
- `docs/20260706-blogger-backfill-write-target-inventory.md`：canonical metadata location = `.publish.json` sidecar；frontmatter blogger block = legacy fallback，**不建議寫入**；future minimal write scope = 只動對應 `.publish.json` sidecar；當時**未填任何 Blogger 推測值**。

當時 `check:blogger-backfill`（report-only / warning-only）量測：scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0。`we-media-myself2` 僅缺 `blogger.bloggerPostId`；6 篇 `20260612-*` sidecar-absent，缺 publishedUrl / postId / publishedAt。

**仍有效之邊界**：不猜 Blogger URL / postId / publishedAt；backfill 寫入 phase 仍待 Dean 提供 Blogger 後台真值 + explicit approval。

---

## 4. Superseded validation baseline 數值

compaction 前 §3a Validation baseline 表中，`check:npm-script-targets` 記為 **37 / 37**。該值於 2026-07-16 compaction 切片實跑量測為 **109 / 109**，§3a 已同步更新。表中其餘 carry-forward 數值未於本切片重新量測，維持原值、原 carry-forward 語意。

---

## 5. First GitHub Pages deploy milestone — 移出之細節（2026-07-03，C1 line）

§3a 保留 milestone 摘要（deploy commit `1170e7e` / live URL / deploy scope）；以下為移出之執行細節（皆為當時量測）：

- **Quarantine 生效**：scaffold `github-pages-blog-planning` flip draft（`94385b1`）→ online **404**；orphan / stale / canary absent。
- **Build hygiene fix 入 pipeline**：`4e21b43` + guard `check:github-build-cache-hygiene` **2/2 PASS**（防 stale `.cache/pages` orphan）。
- **Deploy 前 gates（當時量測）**：`validate:content` 0/135/107、prepublish 16/16、build-cache hygiene 2/2、build / preview / online 全 PASS。
- 全鏈路 docs = `docs/20260703-c1-*`。

**⚠️ 現況提醒（非本節歷史）**：deploy scope 中之 `what-is-design-token` 已於 `8a062b7` 本機 redraft 為 draft；live URL 仍供應舊頁，須 Phase E deploy 後始 404。Phase E **尚未授權**。

---

## 6. ADMIN dashboard UI slice 枚舉 — 移出之細節

§3a 保留摘要（各 slice ✅ landed / browser-PASS / dual-accepted；Apply 永久 disabled、無 write path）；以下為移出之逐項枚舉：

- **R1**：detail panel collapsible + `<td>` closure 7/7
- **Static payload preview**：preview-only；no write path
- **K7**：copy buttons（clipboard-only；Apply 永久 disabled）
- **K8**：field auto-switch / auto-follow
- **K9**：multi-click determinism smoke

**仍有效之邊界（非歷史）**：ADMIN stage = idle freeze；Admin write path（Apply / middleware / admin-write-cli `--apply` / `dryRun:false`）維持 dormant，須另開 phase + explicit approval。

---

## See also

- `CLAUDE.md` §3a（現行 current state snapshot + Core operating rules；本檔之上位）
- `docs/claude-md-ledger-archive/README.md`（compaction 策略 / archive purpose）
- `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md`（完整 current state + 歷史 ledger pointer 索引）
- `docs/20260703-claude-md-compaction-note.md`（2026-07-03 compaction 搬出之內容）
- `docs/20260628-claude-md-state-archive-docs-only-a.md`（phase commits / prior baseline chain 詳述）
- `docs/20260714-admin-github-redraft-write-path-preflight.md`（redraft write-path 現況 §0 + Phase 分階段 §14）
- `docs/20260714-github-redraft-lifecycle-contract.md`（redraft lifecycle / build 契約）

---

（本文件結束 / end of document）
