# Admin Static Payload Preview — Browser Inspection Pending（docs-only record）

> Session: `20260617-night-admin-static-payload-preview-browser-pass-record-a`
> Date: 2026-06-17（Asia/Taipei；evening, after 20:30）
> Type: **docs-only**（source-only inspection PASS；browser-PASS **pending**；no source / no content / no settings / no build / no deploy）

---

## 1. Purpose

針對前一輪 source landed phase `20260617-night-phase2-admin-ui-static-payload-preview-implementation-a`（HEAD `f873ec2`）之 Admin UI 靜態 payload preview，於本輪做：

- only-read source inspection（diff / guardrail grep / validator carry-forward）
- 紀錄 browser-PASS **尚未** 完成之原因（dev server 本輪未啟動；非作者明示要求）
- 明示 source-level 已 PASS 之檢查項，及 browser-level **待驗收** 之 acceptance criteria
- 不假裝 browser PASS；不啟動 dev server；不改 source

本檔屬 docs-only record；不觸動任何 runtime 與 content。

---

## 2. Baseline verify（observed）

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `f873ec2a7a4d5220919728ca06bf30e1fe63fed1`（short `f873ec2`） |
| origin/main | `f873ec2a7a4d5220919728ca06bf30e1fe63fed1` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `feat(admin): add static payload preview` |

→ 與本輪 phase prompt §A 預期一致；baseline 合格。

---

## 3. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 新增 | 本檔 `docs/20260617-night-admin-static-payload-preview-browser-pass-record-a.md` |
| 修改 | **無**（含 source / views / scripts / content / settings / package.json / lockfile / dist*） |
| 未動 | content / settings / templates / vite.config.js / package.json / lockfile / dist* / gh-pages / `.cache` / CLAUDE.md / MEMORY.md |
| 未跑 | build / build:github / build:blogger / deploy / `safe-write:test` / `admin:write` / `admin-write-cli` / dev server / `--apply` / `dryRun:false` |

---

## 4. Evidence used

本輪 **未** 啟動 dev server / **未** 開啟瀏覽器 / **未** 取得使用者截圖；亦無既有 rendered admin HTML artifact（admin view 為 dev-mode-only、不進 prod build / 不 deploy）。

故本輪可用 evidence 限於：

- `git diff add4f98..HEAD`（source diff，read-only）
- `src/views/admin/index.ejs`（read-only inspection）
- `src/scripts/load-admin-posts.js`（read-only inspection）
- `docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md`（前一輪 source landed ledger）
- `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（前一輪 plan）
- `npm run validate:content`（read-only validator；用於 regression 對照）
- guardrail grep（read-only）

→ Source-level inspection PASS；browser-level acceptance **尚未** 完成。

---

## 5. Source-only inspection result（PASS）

### 5.1 Loader 變更（`src/scripts/load-admin-posts.js`）

- diff size: +5 行；純 additive
- 新增 field：`sourceRel: toNormalizedKey(mdPath)`
- 使用既有 `toNormalizedKey`（pm-14 §D.1；absolute → repo-relative posix）
- 不改既有 return shape；既有 view 忽略本欄位 → backout cost = 0
- 無副作用；無 IO；非 async；deterministic

→ PASS。

### 5.2 Admin view 變更（`src/views/admin/index.ejs`）

- diff size: +82 行；純 additive
- 新增 CSS：6 個 `.payload-preview-*` selector（inline `<style>` 內，mirror 既有 `.dry-run-*` 風格）
- 新增 markup：1 個 `<details class="payload-preview-section">` nested 收合區（預設 closed）
- 新增 JS：1 個 `addEventListener('click', ...)` handler（位置於既有 `.dry-run-section` handler 之 forEach scope 內）
- 無新 partial / 無新 module / 無新 external CSS file

→ PASS。

### 5.3 Acceptance criteria 對照（per phase prompt §B）

| # | 條件 | source-level 結論 | 依據 |
| --- | --- | --- | --- |
| 1 | Preview 是否在 per-post detail panel 中出現 | ✅（PASS） | EJS markup 位於 `forEach(posts)` 內，於既有 `.dry-run-section` 之 `.dry-run-result` 之後、`.apply-disabled` button 之前 |
| 2 | 是否預設 collapsed 或不干擾主要 detail panel | ✅（PASS） | `<details>` 無 `open` 屬性 → native HTML 預設 closed；CSS 為 nested 子區塊（border + padding；非全寬） |
| 3 | 是否明確標示 preview only / no write | ✅（PASS） | `<summary>` 標題：「Static payload preview（PREVIEW ONLY — 不執行任何寫入）」；`.dry-run-warning`：「PREVIEW ONLY · 靜態 payload 預覽 · 不寫任何檔案 · 複製不構成核准」；又有「實際寫入僅由終端機 CLI（admin-write-cli）執行，每次仍須 Dean explicit approval」 |
| 4 | 是否沒有 Apply / write / copy button / fetch / POST / XHR / fs / spawn 等真執行風險 | ✅（PASS） | guardrail grep（§7）顯示：`fetch(` / `XMLHttpRequest` / `fs.writeFile` / `writeFileSync` / `spawn` / `child_process` / `exec(` / `method="post"` / `form.submit` 在本 phase 新增區塊內 **0 matches**；無 copy button（本切片不加；對比 commerce snippet helper 有 copy button 為**另一**獨立 feature） |
| 5 | 是否 command preview 只是一段文字，不會執行 | ✅（PASS） | command preview 為 `<pre><code>` + `.textContent` assignment；無 `eval` / `Function()` / shell spawn |
| 6 | 是否 sourceRel / targetRel / field / expectedOldValue / newValue / dryRun:true 顯示合理 | ✅（PASS） | sourceRel = server-side `toNormalizedKey(mdPath)`（read-only `<pre><code>`）；payload JSON 固定 key 順序 `targetRel` → `field` → `expectedOldValue` → `newValue` → `dryRun`；`dryRun` 恆 `true`；無 `--apply`；無 `dryRun:false` |
| 7 | 是否沒有讓 detail panel 明顯更難讀 | ⏸（pending browser PASS） | source-level 已盡量壓低視覺權重（nested `<details>` 預設 closed + 子區塊 border / padding；無新顏色 token），但實際使用者觀感**仍須 browser 實測** |

### 5.4 Deterministic / safety properties（source-level）

| 屬性 | 結論 |
| --- | --- |
| 同輸入恆同輸出 | ✅（無 `Date.now()` / `Math.random()` / `crypto.*` / 序號） |
| key 順序固定 | ✅（純字串拼接，順序由 source 程式碼決定） |
| `dryRun` 恆 `true` | ✅（payload literal `"dryRun": true`；無分支讓 `false` 出現） |
| 無 `--apply` 暴露 | ✅（command literal `node src/scripts/admin-write-cli.js --payload=<temp.json>`；無 conditional / variant） |
| 無自動觸發 | ✅（user 須手動點 `Compute payload preview`；無 `requestAnimationFrame` / `setTimeout` / `setInterval` / `MutationObserver` 自動 fire） |
| 無自動複製 | ✅（無 `navigator.clipboard` / `document.execCommand('copy')` 於本區塊；commerce snippet helper 之 clipboard 路徑為**另一**獨立 region） |
| 無 server-bound 路徑 | ✅（無 `fetch` / `XHR` / form submit；無 endpoint URL；無 hidden form） |

---

## 6. Browser-level acceptance criteria（PENDING）

下列項目須由 user 自行起 dev server + 開瀏覽器人工驗收（per CLAUDE.md §3a Core operating rules：未經 user explicit approval 不主動起 dev server / build / deploy）：

| # | 項目 | 預期 | 對照 |
| --- | --- | --- | --- |
| B1 | per-post detail panel 開啟後可見「Static payload preview（PREVIEW ONLY — 不執行任何寫入）」之 nested `<details>` | 出現於既有 dry-run editor 之下、disabled Apply button 之上 | source diff 已 mirror 該位置 |
| B2 | 預設為 closed（須點才展開） | `<details>` 無 `open`；初次 render 為 closed | source 已驗 |
| B3 | 展開後可見 4 個 field 選項（`description` / `searchDescription` / `titleEn` / `coverAlt`）+ Compute button | mirror plan §5 | source 已驗 |
| B4 | 點 Compute 後 payload JSON 顯示 5 keys 固定順序 + `dryRun:true` | per §5.3 deterministic 規則 | source-level deterministic 已驗 |
| B5 | 點 Compute 後 command preview 顯示 `node src/scripts/admin-write-cli.js --payload=<temp.json>`（無 `--apply`、無 `dryRun:false`） | 固定字串 | source 已驗 |
| B6 | 預覽期間 Apply button 維持 `disabled` + `aria-disabled="true"` | preview ≠ approval | source 已驗（本 phase 未動 Apply button） |
| B7 | 介面整體可讀；preview block 不擾既有 dry-run editor 視覺權重 | 主觀；nested + closed by default | 設計上已壓低，**但實測仍 pending** |
| B8 | 即便點 Compute 多次（同輸入），payload / command 字串完全一致 | deterministic | source 已驗；browser 實測補強 |
| B9 | 即便重整頁面，無 fetch / XHR / network traffic 觸發 | 純 client；無 server-bound | source 已驗 |
| B10 | DevTools Network tab 在點 Compute 時 **不** 增加任何 request | 無 fetch / XHR | source 已驗 |

→ B1–B6, B8–B10 **source-level 已 PASS**；B7 **僅** 能由 browser 確認；整體 **browser-PASS 待 user 另行 approval 起 dev server + 截圖回報**。

---

## 7. Guardrail grep results（read-only）

| pattern | scope | result |
| --- | --- | --- |
| `fetch(` / `XMLHttpRequest` / `fs.writeFile` / `writeFileSync` / `spawn` / `child_process` / `exec(` / `method="post"` / `method='post'` / `.submit()` / `form.submit` | `src/views/admin/index.ejs` | **0 matches** |
| `--apply` / `dryRun:false` / `dryRun: false` | `src/views/admin/index.ejs` | matches 出現於 line 1529 / 1549 / 1551 / 2604 / 2631 —— **全屬 comment / display label 之否定語句**（「無 --apply」/「no dryRun:false by default」），**非** 實際 trigger |
| `navigator.clipboard` / `document.execCommand` / copy button | new payload preview block scope | **0 matches**（本切片無 copy button；commerce snippet helper 之 clipboard 為另一獨立 region，本 phase 未動） |
| `eval` / `new Function(` | new payload preview block scope | **0 matches** |
| `setTimeout` / `setInterval` / `requestAnimationFrame` 之自動觸發 | new payload preview block scope | **0 matches** |

→ Guardrail 全 PASS；無 runtime write / network / shell / auto-trigger 路徑。

---

## 8. Validation carry-forward

| 指令 | 本輪結果 | CLAUDE.md §3a baseline | 對照 |
| --- | --- | --- | --- |
| `npm run validate:content` | 0 errors / 94 warnings / 84 issue-posts | 0 / 94 / 84 | ✅ 一致；無 regression |

production-post warnings = 0；94 warnings 全來自 `content/validation-fixtures/`（mirror baseline）。

未跑（per CLAUDE.md §3a / 本 phase scope）：

- `node src/scripts/validate-content.js --registry-overlay ...`
- `npm run check:adsense-*` / `check:blogger-adsense-output`
- `npm run check-commerce-affiliate-resolver`
- `npm run check:admin-governance-aggregation`（前一輪已跑；本輪不重跑 per §3a）
- `npm run check:admin-validation-consume`（同上）
- `npm run report:validation` / `check:validation-report`
- build / build:github / build:blogger / build:promotion / build:sitemap / preview / deploy
- `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false`
- dev server

---

## 9. Explicit no-touch confirmation

本 phase **未**：

- 動 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist/` / `dist-blogger/` / `dist-promotion/`
- 改 `package.json` / lockfile / `vite.config.js` / `.cache`
- 改 CLAUDE.md / MEMORY.md / `memory/`
- 啟動 dev server / build / deploy / Blogger repost
- 啟用 Admin Apply / middleware / API / POST endpoint
- 執行 `admin-write-cli` / `safe-write:test` / production dry-run
- 加 `--apply` / `dryRun:false` / `dryRun: false`
- 加 `fetch` / `XMLHttpRequest` / form submit / auto-copy / auto-submit
- amend / rebase / force-push / `git push --force` / `--no-verify`
- npm install / 動 dependency
- 動 Blogger / GA4 / AdSense / Google Drive / Search Console / GitHub Pages 後台

---

## 10. Browser-PASS gating（pending → PASS path）

要把本 record 升為 browser-PASS，須由 user explicit approval 後執行（**非** 本輪 scope）：

1. user explicit approval 起 dev server（`npm run dev`）
2. 開瀏覽器 → admin index → 任一 post detail panel
3. 對照 §6 B1–B10 acceptance criteria 逐項勾選
4. 至少 1 張截圖（preview block 展開 + Compute 後狀態）
5. DevTools Network tab 截圖（點 Compute 時無 request）
6. 把 evidence 回貼到本檔 §11 之 update slot；改 phase name 為 `*-browser-pass-record-b`（新 phase + 新 docs ledger；不 amend 本檔）

→ 本輪 **不** 主動執行上述任一項；待 user 明示。

---

## 11. Pending evidence slot（empty）

```
[尚未填入；待 user 自行起 dev server + 提供瀏覽器截圖 + DevTools Network 觀察後，由獨立後續 phase 補上]
```

---

## 12. Recommended next step

- **保守路徑**：idle freeze；等 user 自行起 dev server 後另開 phase 補 browser-PASS record。
- **可選 follow-up**（各須獨立 phase + user explicit approval）：
  - K6（建議名）`20260617-night-admin-static-payload-preview-browser-pass-record-b`：user 起 dev server 後人工驗收 + 截圖回填 §11
  - K7（建議名）Copy buttons（mirror commerce snippet helper；plan §6 optional；獨立切片）
  - K8（建議名）Field 選項以「目前 dry-run diff 結果中變更欄位」自動切換（避免 user 重選）

**不主動執行**：build / deploy / repost / Admin Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false` / dev server / Blogger / AdSense / GA4 / Google 後台。

---

## 13. Cross-links

- `docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md`（前一輪 source landed ledger；HEAD `f873ec2`）
- `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（前一輪 docs-only plan）
- `docs/20260617-phase2-admin-ui-copyable-payload-panel-preanalysis.md`
- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`
- `docs/20260617-phase2-admin-ui-stale-copy-correction-record.md`
- `docs/20260617-phase2-admin-ui-phase3-phase4-wording-correction-record.md`
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §8 / §27 / §28 / §29

---

（本文件結束）
