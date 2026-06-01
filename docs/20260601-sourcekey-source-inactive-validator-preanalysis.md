# 2026-06-01 sourceKey `source-inactive` Validator Preanalysis (docs-only)

> Phase: `20260601-am-11-sourcekey-source-inactive-validator-preanalysis-docs-only-a`
> Date: 2026-06-01 11:34 +0800
> Scope: **docs-only**（單檔新增；無 `src/` / `content/` / `settings` / `templates` / `validation-fixtures` / `package` / `dist` / `gh-pages` / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `62154c1da628f28369a388f04f2611cacfde4c59`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**
> Frozen baseline subject: `docs(sourcekey): record admin selector checkpoint`

---

## 1. Executive Summary

- 本文件針對「**`source-inactive` validator warning**」做 **docs-only preanalysis**：規劃未來若 link-sources registry 出現 `isActive: false` 之 source、而 `relatedLinks` / `otherLinks` 仍引用該 sourceKey 時，validator 應如何提示。
- **本 phase 不實作 validator、不修改 `src/scripts/validate-content.js`、不新增 validation fixture、不改 registry、不改 content / templates。** 唯一變更為新增本 docs 檔。
- **目前所有 link-sources（8 sources）皆 `isActive: true`**，因此此 rule 即使實作亦無觸發案例 → **目前不是 urgent blocker**；屬「先把設計寫清楚、實作留待獨立明示 phase」之保守 preanalysis。
- 本文件**不授權任何 source implementation / write path / fixture creation / deploy / activation**。任何實作皆需 user explicit approval 之獨立 phase。
- 本文件為 `docs/20260601-sourcekey-admin-selector-preanalysis.md` §6（Source-inactive Warning Concept）之**展開與獨立化**；不取代既有 §6，兩者一致、互相 cross-reference。
- 預期 commit + push 後 production state drift = 0；validate baseline 維持 `0 / 47 / 42` 不變。

### 1.1 一句話裁決

> **建議完成本 preanalysis commit + push 後 Final Idle Freeze / EXIT；不直接接 validator implementation；若要實作須下一個獨立 phase 且先做 acceptance 或更細設計。**

---

## 2. Current Baseline

| 項目 | 值 |
|---|---|
| repo path | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `62154c1da628f28369a388f04f2611cacfde4c59` |
| origin/main（本 phase 啟動時） | `62154c1da628f28369a388f04f2611cacfde4c59` |
| short | `62154c1` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(sourcekey): record admin selector checkpoint` |

State 確認：

- ✅ sourceKey Admin selector preview 已完成並驗收（read-only / disabled preview；am-3 落地 / am-4 PASS）。
- ❄ `source-inactive` validator **未實作**（rule logic 本身不存在）。
- ❄ Admin Apply / middleware write route / admin-write-cli production path **dormant**。
- ❄ reverse UTM / pm-26 deploy gate / download workflow **dormant / blocked**。

---

## 3. Existing SourceKey Validation State

目前已落地之 sourceKey 相關驗證 / 警告（皆 **warning-only**，不阻擋 `validate:content`）：

| 規則 / 行為 | 狀態 | 位置 |
|---|---|---|
| `related-links-source-key-invalid-type` | ✅ landed（pm-14 step-7-d） | `src/scripts/validate-content.js:212-222`（`sourceKey !== undefined` 且 `typeof !== 'string'`） |
| `related-links-source-key-empty` | ✅ landed（pm-14 step-7-d） | `src/scripts/validate-content.js:223-229`（`typeof === 'string'` 且 `trim() === ''`） |
| `related-links-source-key-not-found` | ✅ landed（am-8 step-7） | `src/scripts/validate-content.js:230-237`（non-empty string 但不在 `activeSourceKeys`） |
| active sourceKey set 建構 | ✅ landed | `src/scripts/validate-content.js:131-142`（`buildActiveSourceKeySet`；`isActive === false` 之 source 被排除） |
| 共用 helper（validator / Admin selector / future build 共用） | ✅ landed | `src/scripts/active-source-keys.js`（`buildActiveSourceKeySet` / `loadActiveSourceKeySet` / `buildActiveSourceOptions`） |
| platform fallback / backward-compatible | ✅ landed | `sourceKey` 為 optional；`undefined` 不觸發任何 warning；既有顯示行為不退化（per `docs/related-links-schema.md`） |
| GA4 `link_source_key` | ✅ landed | sourceKey → GA4 `link_source_key` data attribute |
| Admin selector preview（read-only） | ✅ landed + 驗收（am-4 PASS） | `src/views/admin/index.ejs:634-698`（disabled `<select>`；視覺 warning） |

互斥規則順序（既有；`validate-content.js:212-237`）：

```text
if (entry.sourceKey !== undefined) {
  if (typeof !== 'string')              → source-key-invalid-type
  else if (trim() === '')               → source-key-empty
  else if (!activeSourceKeys.has(key))  → source-key-not-found
  // else: 合法
}
```

**關鍵觀察**：`buildActiveSourceKeySet`（`validate-content.js:137`）以 `if (s.isActive === false) continue` 排除 inactive source。因此**inactive source 之 sourceKey 目前不在 `activeSourceKeys`，會被既有 `not-found` 分支攔截** —— 即 inactive 當前「偽裝成」not-found，**無獨立 `inactive` 訊號**（per `validate-content.js:129-130` 註解之既定行為）。

---

## 4. Registry State

`content/settings/link-sources.json`（read-only；**本 phase 不修改**）：

- `version: 1`；`sources[]` 共 **8 筆**。
- **全部 `isActive: true`**。
- sourceKey 清單（依 `sortOrder` 升冪）：

| sortOrder | sourceKey | displayLabel | sourceType | defaultTargetType | isActive |
|---|---|---|---|---|---|
| 10 | `blogger` | BLOG | `internalPlatform` | internal | true |
| 20 | `github` | GITHUB | `internalPlatform` | internal | true |
| 30 | `bagel-books` | 貝果書屋 | `internalCategory` | internal | true |
| 40 | `life` | 生活 | `internalCategory` | internal | true |
| 50 | `tech-note` | 技術文章 | `internalCategory` | internal | true |
| 60 | `youtube` | YouTube | `mediaPlatform` | external | true |
| 70 | `netflix` | Netflix | `mediaPlatform` | external | true |
| 80 | `taipei-library` | 台北市立圖書館 | `library` | external | true |

欄位角色（registry schema；read-only 參考）：

- `sourceKey`：entry 引用之唯一 key；validator lookup / GA4 `link_source_key` / Admin selector value 皆以此為準。
- `isActive`：**未來 `source-inactive` rule 之唯一觸發依據**；目前全 `true`。`buildActiveSourceKeySet` 僅以 `=== false` 排除（`undefined` / 缺欄位視為 active）。
- `displayLabel`：UI / renderer 顯示字串（如 Admin selector option 文字）。
- `sourceType`：分類（`internalPlatform` / `internalCategory` / `mediaPlatform` / `library`）；Admin selector option 前綴顯示用。
- `sortOrder`：Admin selector option 排序（升冪）。
- `defaultTargetType` / `defaultPlatform` / `defaultRel` / `defaultTrackingPolicy`：renderer / GA4 policy；**不**暴露給 Admin selector preview（preview 只取 4 欄）。

> **本 phase 不改 registry**（不切任何 source 為 inactive；不新增 / 移除 source；不改 sortOrder / displayLabel）。

---

## 5. Proposed `source-inactive` Warning Behavior

規劃**未來** rule 行為（僅設計；本 phase 不實作）：

- 當 `relatedLinks` / `otherLinks` 使用之 `sourceKey` **存在於 registry**（`sources[].sourceKey` 命中），但該 source 之 **`isActive === false`** 時 → 產生 **warning**。
- 建議為 **warning，不是 error**。
- **不阻擋** `validate:content`（exit code 不因此變 non-zero）。
- **不自動改寫 content**（不寫回 `.md` frontmatter）。
- **不移除 sourceKey**（不主動清除既有 entry 引用）。
- **不改 templates / registry**（rule 只讀；不寫 settings；不切換 `isActive`）。
- **不影響 GA4 已輸出的 `link_source_key`**（renderer / GA4 data attribute 行為不變；inactive 仍照舊輸出 sourceKey，僅 validator 提醒）。
- **不影響 renderer output**，除非未來另開 phase 明示（本 rule 純 validator 提醒；不改 fallback chain / 顯示）。

建議 rule id：`related-links-source-key-inactive`（mirror 既有三條 sourceKey 規則命名 pattern；對齊 am-3 preanalysis §6.1）。

---

## 6. Difference From Existing Warnings

明確區分四種 sourceKey 狀態（前三條已實作，第四條為本文件規劃）：

| # | 狀態 | 觸發條件 | rule id | 狀態 |
|---|---|---|---|---|
| 1 | **missing / empty** | `sourceKey` 為 `string` 且 `trim() === ''` | `related-links-source-key-empty` | ✅ landed |
| 2 | **invalid type** | `sourceKey !== undefined` 且 `typeof !== 'string'`（array / null / number…） | `related-links-source-key-invalid-type` | ✅ landed |
| 3 | **not found in registry** | non-empty string；**registry 無此 key**（且非 inactive 偽裝） | `related-links-source-key-not-found` | ✅ landed |
| 4 | **found but inactive** | non-empty string；**registry 有此 key** 但 `isActive === false` | `related-links-source-key-inactive` | ❄ **proposed（本文件）** |

語義差異關鍵：

- `not-found` = 該 key **根本不在 registry**（typo / 已刪除 / 從未定義）。
- `inactive` = 該 key **確實在 registry**，但被作者 / admin **刻意停用**。
- 兩者修復動作不同：`not-found` 通常是修 typo 或補 registry；`inactive` 通常是改引用其他 active source，或（管理決策）重新 activate。
- **目前缺第 4 條 → inactive 會落入第 3 條（not-found）**，因 `buildActiveSourceKeySet` 已排除 inactive（§3 關鍵觀察）。實作第 4 條時**必須在 `not-found` 判斷之前**插入 inactive 判斷，否則永遠被 not-found 先攔（對齊 am-3 §6.3）。

---

## 7. Future Implementation Design (no code this phase)

僅描述未來若要實作**可能**修改之檔案；**本 phase 不修改下列任一檔案**。

| 未來可能修改 | 變更性質（規劃） |
|---|---|
| `src/scripts/validate-content.js` | 於 `validateRelatedLinksField`（現 `:212-237`）既有三條 sourceKey 互斥鏈中，於 `not-found` **之前**新增第 4 條 `inactive` 判斷；需另取得 registry 之 inactive set 或 full source map（現 `buildActiveSourceKeySet` 只回 active key set，無法區分 inactive vs not-found） |
| sourceKey registry lookup helper | 現 `src/scripts/active-source-keys.js` 僅提供 active set / active options；未來需新增「**inactive set**」或「**full source map（含 isActive）**」helper，使 validator 能判斷「在 registry 但 inactive」；`buildActiveSourceKeySet` / `buildActiveSourceOptions` 不變（避免回歸） |
| docs（related-links-schema / 規則表） | 補第 4 條 rule 之欄位字典 / 行為說明（per `docs/related-links-schema.md` §11.5 step pattern） |
| optional validation fixture | 一筆引用 inactive sourceKey 之 `_test-*` fixture（驗證 rule 觸發；mirror 既有三條規則之 fixture 落地 pattern） |

建議互斥順序（規劃；對齊 am-3 §6.3）：

```text
if (entry.sourceKey !== undefined) {
  if (typeof !== 'string')                 → source-key-invalid-type
  else if (trim() === '')                  → source-key-empty
  else if (registry has key && !isActive)  → source-key-inactive   ← 新增（須在 not-found 之前）
  else if (!activeSourceKeys.has(key))     → source-key-not-found
  // else: 合法
}
```

> **明確聲明：本 phase 不修改 `src/scripts/validate-content.js`、不修改 `src/scripts/active-source-keys.js`、不修改既有 docs、不新增 fixture。**

---

## 8. Fixture Strategy (plan only; no fixture this phase)

僅規劃；**本 phase 不新增任何 fixture**。

未來若實作 rule，需要一個觸發案例。比較兩種可行做法：

| 方案 | 做法 | 優點 | 缺點 |
|---|---|---|---|
| **A. validation-fixture 文章 + temporary inactive source** | 在 registry 加一筆 `isActive: false` 之測試 source，並新增一筆 `_test-*` fixture 引用之 | 直接、貼近真實 path | **須改 registry**（即使 `isActive: false` 也是 settings 變更）；inactive source 永久留在 production registry 較髒 |
| **B. fixture-local registry override / settings fixture** | rule 測試以隔離之 settings fixture 注入 inactive source（不污染 production `link-sources.json`） | production registry 不變；測試隔離 | 需 validator 測試支援注入 settings（現 `validateContent({ posts, settings })` 已可傳入 settings，理論可行）；fixture 機制較複雜 |

**建議（保守，待未來 phase 細評）**：

- 優先設計**最小測試策略**：盡量**不長期污染 production registry**。若 `validateContent` 已接受注入式 `settings`（現簽名 `validateContent({ posts, settings })` 確實支援），方案 B 對 production registry 影響最小，為較保守選項。
- 若方案 B 機制成本過高，再評估方案 A，並要求 inactive 測試 source 命名清楚（如 `_test-inactive-*`）且文件記錄其用途。
- **本 phase 不建立任何 fixture、不改 registry、不改 validator 測試。** 上述為純規劃比較。

---

## 9. Validate Baseline Impact

- **本 phase 為 docs-only，不改 validate baseline**：commit 前後皆預期 `0 errors / 47 warnings / 42 posts`。
- 未來若實作 rule：
  - 因目前 8 sources 全 active，rule 上線後若**不**新增 inactive fixture，預期 baseline **仍不變**（無觸發案例）。
  - 若同時新增 inactive warning fixture（§8），則 warning 數會 +1（或依 fixture 數量增加），baseline 變動。
- **任何 baseline 變動需要獨立 acceptance phase**：須明確記錄變動前後數字、變動原因（新 rule + 新 fixture），並 user 驗收。本 phase **不**啟動該 acceptance。

---

## 10. Admin UI Impact

- 目前 Admin selector 對 unknown / inactive sourceKey **僅視覺提示**：`src/views/admin/index.ejs:662-685` 以 `srcOpts`（active only）判斷 `skKnown`，不命中即顯示「⚠ 未知 / inactive」badge + option（`:671` / `:684`）。此為**純視覺**，**不是 validator rule**（`:695` 明確聲明）。
- 未來 `source-inactive` validator warning **不等於 Admin write enable**：validator 只讀提醒；與 Admin 寫入能力為兩條獨立軸線。
- **不啟用 Apply**（FB / SEO 之 `.apply-disabled` 永遠 disabled；無 click handler）。
- **不新增 middleware write route**（無 server-side write handler；無 `fs.writeFile` 路徑）。
- **不使用 admin-write-cli**（不執行 dry-run / apply / real write）。
- 未來若同時希望 Admin selector 區分「unknown（registry 無）」vs「inactive（registry 有但停用）」，屬獨立 UI phase，需另行明示；本 phase **不**改 Admin UI。

---

## 11. Risks / Non-goals

本 phase **明確不**做下列任一項：

- ❌ 不把 inactive 當 **error**（建議 warning-only）。
- ❌ 不實作 validator rule（不改 `src/scripts/validate-content.js`）。
- ❌ 不改 registry lookup helper（不改 `src/scripts/active-source-keys.js`）。
- ❌ 不新增 validation fixture。
- ❌ 不修改既有 content（不寫回 `.md` frontmatter；不移除 sourceKey）。
- ❌ 不修改 registry active status（不切任何 source 為 inactive）。
- ❌ 不修改 templates。
- ❌ 不影響 GA4 已輸出之 `link_source_key`。
- ❌ 不啟動 build / deploy / Blogger repost / GA4 validation。
- ❌ 不解鎖 pm-26 deploy gate。
- ❌ 不啟動 reverse UTM activation。
- ❌ 不啟動 download workflow / loader / validator / picker / renderer / migration。
- ❌ 不啟用 Admin Apply / middleware write route / admin-write-cli。
- ❌ 不 npm install / fetch / pull / merge / rebase / reset / stash / amend / force-push。

Non-goal 提醒：本文件**不授權** source implementation；validator rule 之落地須獨立明示 phase（且先 acceptance 或更細設計）。

---

## 12. Candidate Next Phases

依保守程度排序（最多 4 個；最保守在前）：

| 排序 | 候選 | 性質 | 推薦 |
|---|---|---|---|
| 1 | **Final Idle Freeze / EXIT** | 不啟動任何 | ⭐ **預設推薦** |
| 2 | `source-inactive` validator **docs acceptance（read-only）** | 純 read-only 複核本文件設計；不改檔 | 僅 user 明示 |
| 3 | `source-inactive` validator **implementation preanalysis 或 source phase** | 涉及 `src/` 變更 + fixture；**需 user explicit approval** | 僅 user 明示；不可順手啟動 |
| 4 | download / reverse UTM / pm-26 其他 track | 維持**獨立**；不混入本 sourceKey track | 僅 user 明示；各自獨立 phase |

說明：

- 僅啟動 user 明示之**單一** candidate；不擴張 scope；不混合多 candidate。
- download / reverse UTM / pm-26 與本 sourceKey track **互相獨立**，不得在同一 phase 混合。

---

## 13. Final Recommendation

**預設推薦：本 phase 完成 commit + push 後 Final Idle Freeze / EXIT。**

- **不直接接 source implementation**（不順手改 `validate-content.js` / helper / fixture）。
- 若要實作 validator，需**下一個獨立 phase**，且**先做 acceptance 或更細設計**（rule id / 互斥順序 / inactive set helper / fixture 策略確認後再寫 code）。
- 理由：
  1. 目前 8 sources 全 active，rule 無觸發案例 → 非 urgent blocker。
  2. 既有三條 sourceKey 規則 + Admin 視覺提示已覆蓋日常情境；inactive 暫由 `not-found` 視角捕捉。
  3. 對齊 `CLAUDE.md` §1 / §29 / §30「不過度工程化」原則與保守落地慣例。
  4. **下次 cold-start 必須先 baseline verify** 再行動。

---

## Cross-references

- `docs/20260601-sourcekey-admin-selector-preanalysis.md` §6（Source-inactive Warning Concept；本文件展開來源）
- `docs/20260601-sourcekey-admin-selector-checkpoint.md`（sourceKey track frozen state；§3 / §5 / §8）
- `docs/related-links-schema.md`（relatedLinks / otherLinks + sourceKey metadata schema；§11.5 step pattern）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan；§15.F prerequisites）
- `src/scripts/validate-content.js`（既有三條 sourceKey 規則；`:131-142` / `:212-237`）
- `src/scripts/active-source-keys.js`（active set / active options helper；未來需擴充 inactive set helper）
- `src/views/admin/index.ejs`（Admin selector preview；`:634-698`；視覺 warning only）
- `content/settings/link-sources.json`（8 sources；全 active）
- `CLAUDE.md`（專案規範主檔；§16.5 relatedLinks / otherLinks / §29 / §30）

---

End of preanalysis.
