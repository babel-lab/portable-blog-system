# 20260703 CLAUDE.md compaction note

本檔承接 2026-07-03 `docs(state): compact claude state headroom` slice 從 `CLAUDE.md` §3a 搬出的**歷史流水帳 / 冗長敘述**。

搬出目的：`CLAUDE.md wc -m` 在 compaction 前 = 39841 / 40000，headroom 僅約 159 chars，已無法再 sync state。依 §3a「Historical ledger replacement rule」，逐 phase 戰史（commit SHA / 逐項 acceptance）本不應留在 CLAUDE.md，故搬至本檔並在 CLAUDE.md 留短 pointer。

**本次僅搬移敘述，不改變任何功能語意、不改 baseline 數值、不追尾 docs-lag。**

---

## 1. Recent phase commits（自 §3a 搬出的逐 slice SHA 史）

搬出前 CLAUDE.md §3a 原文：

> **Recent phase commits**（完整逐 slice 史見 `docs/20260628-claude-md-state-archive-docs-only-a.md` §6 + `docs/claude-md-ledger-archive/`）：`a4fb36e` / `7ecf644` / `d52b890` feat(admin) display-only hints（category registry / SEO length / slug collision）+ `eab2160` docs(admin) Phase 1 manual E2E runbook + `4ee021a` docs(admin) clarify draft-stage hint scope + `5a85d7d` / `1dfe281` / `0566a49` docs(state) E2E PASS / publish checklist / dual repo baseline；皆 additive、無 build / deploy；export contract 維持 `status:"draft"` + `draft:true`。GitHub draft/Admin flow = **complete**；**first GitHub Pages publish/build/deploy DONE（2026-07-03；見上 First deploy milestone）**；後續文章 deploy 逐篇 Dean-gated。Admin Markdown export/import hygiene = `check:admin-markdown-export` **256/256 PASS**（含 8-layer **100/100 milestone** `a546ae9` + #101–#257 加固鏈；逐項見 archive §3 / §6）。

保留要點（已回寫 CLAUDE.md pointer）：皆 additive、無 build / deploy；export contract 維持 `status:"draft"` + `draft:true`；GitHub draft/Admin flow = complete；first GitHub Pages deploy DONE；後續 deploy 逐篇 Dean-gated；`check:admin-markdown-export` 256/256 PASS。更早逐 slice 史另見 `docs/20260628-claude-md-state-archive-docs-only-a.md` §6 + `docs/claude-md-ledger-archive/`。

---

## 2. ADMIN Phase 1 Admin UI / Markdown draft export MVP（自 §3a 搬出的冗長細節）

搬出前 CLAUDE.md §3a 原文：

> **Phase 1 Admin UI / Markdown draft export MVP** ✅ landed（latest `a255689`，2026-06-30；smoke 157/157；8-layer 100/100 milestone + #101–#257 加固鏈；逐刀 / 逐項 smoke / hardening 歷史 archived in `docs/20260628-claude-md-state-archive-docs-only-a.md` §1 / §3 / §6，本段不再展開）：
>
> - Route `/admin/#new-post-draft`（dev-only；不進 prod build；不 deploy；noindex）；export panel（copy markdown / download `.md` / target path / copy path / copy validation command）+ manual import checklist + ready preflight + SEO/cover draft fields + category/tag registry hints + titleEn 三刀 均已 landed
> - Export contract 維持 `status:"draft"` + `draft:true`（**無** ready option、**無** repo write path）；guard `check:admin-markdown-export` **256/256 PASS**（含 category registry-bound：`<select id="npd-category">` 鎖定；改 free-text/datalist 未批准，須另開 phase）
> - Solo-admin / MD-file-based：**無** DB / **無** login / **無** multi-user；smoke evidence 為 source-level/static + helper-driven（非完整 browser-run smoke）
>
> ADMIN stage checkpoint = ✅ **idle freeze**。後續 session **不主動推進**（完整 browser-run smoke〔**不引入 Playwright / devDep**；不自行啟動 dev server〕/ B1·B3·B4·B5 / Admin richer fields / ready option / R2–R5 / SEO Dry-run edit / filter chip / warning badge / per-post prescription / write path〔Apply / Save / auto-fix〕/ loader aggregation migration / validator `--report-json` 等；**各須獨立 phase + user explicit approval；不直接實作**）。

保留要點（已回寫 CLAUDE.md pointer）：Phase 1 Admin UI / Markdown draft export MVP ✅ landed（latest `a255689`，2026-06-30；smoke 157/157）；Route `/admin/#new-post-draft` dev-only、不進 prod build、不 deploy、noindex；export contract 維持 `status:"draft"` + `draft:true`，**無** ready option、**無** repo write path；guard 256/256 PASS；category `<select id="npd-category">` registry-bound（改 free-text 須另開 phase）；solo-admin / MD-file-based（無 DB / login / multi-user）。ADMIN stage = **idle freeze**，後續（browser-run smoke〔不引入 Playwright / devDep〕/ richer fields / ready option / R2–R5 / write path / loader migration 等）**各須獨立 phase + explicit approval**。

---

## 3. 保留在 CLAUDE.md 的項目（未搬出，僅供對照）

以下依 slice spec **必須保留於 CLAUDE.md 本體**，本檔不承接、不取代：

- current frozen baseline（source HEAD `08162e9` / deploy `1170e7e`）
- source repo / deploy clone 之 HEAD / branch / clean / ahead-behind 狀態描述
- red lines / 禁止事項（AdSense secret / commerce registry / download registry / dormant-blocked）
- Validation baseline 重要數字（§Validation baseline 整表）
- GitHub Pages first deploy milestone baseline
- Recommended next paths / 下一步策略
- CLAUDE.md headroom warning + size target

## 5. Direct-node smoke 清單（自 §3a 搬出；非 package scripts、非 validation-report baseline 成員）

搬出前 CLAUDE.md §3a 原文：

> Direct-node smoke（**非** package scripts、**非** validation-report baseline 成員）：`src/scripts/check-ga4-param-allowlist.js`（13/13）/ `src/scripts/check-blogger-operator-guidance.js`（11/0）/ `src/scripts/check-platform-policy-effective.js`（40/0）/ `src/scripts/check-github-draft-metadata.js`（11/0）。

這些為補充性 smoke（直接 node 呼叫），非 §Validation baseline 整表成員；carry-forward，本 phase 未跑不變動。

## 6. GA4 D4 / param allowlist Route B 欄位枚舉（自 §3a 搬出）

搬出前 CLAUDE.md §3a 原文（field 枚舉部分）：

> GA4 D4 / param allowlist Route B = **CLOSED / PASS**：D4 first-batch populated＝`link_type` / `provider` / `placement` / `link_label`；確認 **absent**＝`link_url` / `target_url` / `outbound` / `link_source_key`。Route B = DebugView **raw params** 之 allowlist，**非** static HTML attr removal。

- D4 first-batch **populated**（4 custom dimensions）：`link_type` / `provider` / `placement` / `link_label`
- 確認 **absent**（4 raw params）：`link_url` / `target_url` / `outbound` / `link_source_key`
- Route B = DebugView **raw params** 之 allowlist，**非** static HTML attr removal
- 完整 evidence chain / closure record：`docs/20260624-ga4-d4-allowlist-final-closure-record.md`

## 4. 不做

- 不改功能語意、不改 baseline 數值、不追尾 docs-lag
- 不碰 `src/` / `content/` / `content/settings/` / `package.json` / lockfile / `dist/`
- 不碰 deploy clone / gh-pages
- 不碰 Blogger / Google / GA4 / AdSense / Search Console
- 不碰 memory / MEMORY
