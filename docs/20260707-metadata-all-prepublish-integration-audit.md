# metadata-all ↔ prepublish integration audit（2026-07-07）

read-only audit note。本輪**不**改 package script、**不**改 guard 語意、**不**動 content/frontmatter、**不** deploy。
結論採 **Option B（docs-only audit note）**。

---

## 0. Frozen baseline（audit 時）

- source repo：`/d/github/blog-new/portable-blog-system`
- branch：`main`
- HEAD == origin/main == `738da53`（subject `chore(content): register metadata all checks`）
- ahead/behind = `0 0`、working tree clean、`.git/index.lock` absent
- deploy clone `/d/github/blog-new/portable-blog-deploy`（gh-pages）本輪**未碰**

---

## 1. 現有檢查入口（package.json scripts 實測）

### 1a. prepublish / readiness 入口

| script | target | 性質 |
| --- | --- | --- |
| `check:github-pages-prepublish` | `src/scripts/check-github-pages-prepublish-readiness.js` | 單一 JS，**git-state / dual-repo deploy-safety guard** |
| `check:github-pages-prepublish-smoke` | `src/scripts/check-github-pages-prepublish-readiness-smoke.js` | 單一 JS，failure-branch smoke（fixture env override） |

`check:github-pages-prepublish` 檢查範圍（純 read-only）：

- Source repo：is git repo / branch==main / working tree clean / HEAD==origin/main / ahead-behind 0/0 / index.lock absent / 2 支 required doc 存在
- Deploy clone（`../portable-blog-deploy`，只讀）：dir 存在 / branch==gh-pages / clean / HEAD==origin/gh-pages / ahead-behind 0/0 / index.lock absent

→ 它是「deploy 前 repo 是否處於安全可 publish 狀態」的 git-state 守門，**不** aggregate 任何 content / metadata 檢查，也**不** spawn 其他 `npm run`。

### 1b. metadata suite 入口（package.json 唯一的 `npm run` 串接 umbrella）

| script | 串接內容 | 分工 |
| --- | --- | --- |
| `check:metadata-guards` | 5 個 single-field guard | content-type / adsense-mode / campaign-purpose / campaign-industry / custom-promo |
| `check:metadata-cross-fields` | 3 個 cross-field guard | campaign-metadata / custom-promo / adsense |
| `check:metadata-all` | `check:metadata-guards && check:metadata-cross-fields` | 完整 metadata suite umbrella |

三者皆 report-only / warning-only / exit 0，屬**內容 metadata 品質**域。

---

## 2. `check:metadata-all` 的定位

- 域：**content metadata quality**（掃 frontmatter / ads 設定的型別與 cross-field 一致性；warning-only、不阻擋 build）。
- 與 `check:github-pages-prepublish` 的域不同：後者是 **git/deploy repo-state safety**，前者是 content 品質。
- `check:metadata-all` 目前**未**被任何 prepublish / readiness 流程引用（grep `package.json` / `CLAUDE.md` 僅見自身定義與 baseline 表）。

---

## 3. 是否建議未來納入

**保守建議：暫不納入 `check:github-pages-prepublish`。** 若未來要集中「release 前全部檢查」，建議**另開**一個 top-level readiness umbrella（package.json 純串接，不改既有 JS），例如：

```
check:release-readiness = check:github-pages-prepublish && validate:content && check:metadata-all
```

而**不是**把 metadata-all 塞進 git-state 守門 JS。理由：

1. 域分離：git-state safety 與 content-quality 是兩個獨立關注點，混在同一支 guard 會讓失敗原因難定位。
2. `check:github-pages-prepublish` 是單一 JS，納入 metadata-all 須**改 JS**（本輪明確禁止：不新增 JS、不改語意）。
3. metadata-all 為 warning-only / exit 0，而 prepublish guard 為 fail-fast exit 1；語意不對稱，混入會稀釋 deploy 守門的 fail-fast 意圖。

上述 top-level umbrella 為**未來提案**，須另開 phase + user explicit approval，本輪不建立。

---

## 4. 為什麼本輪不直接改 package script（不採 Option A）

- Option A 的前提是「repo 已有明確的 prepublish umbrella 且適合加 metadata suite」。實測**不存在**這樣的 package.json 串接 umbrella —— `check:github-pages-prepublish` 是單一 git-state JS，非 `npm run` 串接。
- 唯一的 `npm run` 串接 umbrella 就是 metadata 三支本身；把 metadata-all 加進它們會造成自我遞迴 / 無意義。
- 硬把 metadata-all 塞進 readiness JS 會 (a) 需改 JS（禁止）、(b) 混域、(c) scope膨脹、(d) 破壞 fail-fast 語意。
- 故採 Option B：docs-only 記錄，不動 package script。

## 5. Option C 不成立

`check:metadata-all` 目前**未**被納入任何 prepublish / readiness 流程，因此非「已完整整合」狀態。

---

## 6. 下一步建議（皆須另開 phase + explicit approval，本輪不執行）

1. 若要 release-前一鍵檢查：新增 package.json 純串接 top-level umbrella（如 §3 的 `check:release-readiness`），不改既有 JS、不改 metadata 三支語意。
2. 該 umbrella 若新增，`check:npm-script-targets` 因串接 script 無 `.js` target 仍維持不變（純串接貢獻 0 target）。
3. 在此之前維持現狀：metadata suite 與 prepublish guard 各自獨立呼叫。

---

## 7. 本輪驗證結果（read-only）

| 指令 | 結果 |
| --- | --- |
| `npm run check:metadata-all` | 全 PASS / exit 0；scanned 17、candidates 0、warnings 0（三 cross-field 皆 0） |
| `npm run check:npm-script-targets` | 46/46 PASS（45 targets） |
| `npm run validate:content -- --check` | 0 error / 135 warning / 107 post |
| `git diff --check` | 無 whitespace error（本 doc 為唯一新增檔） |

- `check:metadata-all` 仍只串接兩個 umbrella（`check:metadata-guards && check:metadata-cross-fields`）。
- `check:metadata-guards` 仍只含五個 single-field guard。
- `check:metadata-cross-fields` 仍只含三個 cross-field guard。
- 未碰 deploy clone / gh-pages / content / frontmatter / 任何 JS / package.json script。
