# check:release-readiness runbook / usage note（2026-07-07）

docs-only 使用說明。記錄 `check:release-readiness` 這支 top-level umbrella **何時跑 / 包含什麼 / 不包含什麼**。
本輪**不**改 package script、**不**改任何 guard、**不**動 content/frontmatter、**不** deploy、**不**碰 gh-pages / deploy clone。

前置設計脈絡見 `docs/20260707-metadata-all-prepublish-integration-audit.md`（§3/§6 為本 umbrella 之提案；本 runbook 記錄其**已落地後**的使用方式）。

---

## 0. Frozen baseline（撰寫時）

- source repo：`/d/github/blog-new/portable-blog-system`
- branch：`main`
- HEAD == origin/main == `b5c45d0`（subject `chore(content): register release readiness check`）
- ahead/behind = `0 0`、working tree clean、`.git/index.lock` absent
- deploy clone `/d/github/blog-new/portable-blog-deploy`（gh-pages）本輪**未碰、未讀取**

---

## 1. 定位

`check:release-readiness` 是 **top-level release readiness umbrella**。

- **只做 checks**：git-state safety + prepublish smoke + metadata report-only suite + content validation。
- **不** build、**不** deploy、**不** push、**不**碰 gh-pages、**不**寫任何檔。
- 它是「release / 發布前把所有既有檢查一鍵跑完」的入口，但它**本身不是 deploy 指令**，跑完 exit 0 **不代表**已發布，只代表 repo 通過既有 read-only 檢查。

---

## 2. 實際 script 內容

package.json（現況，唯一定義，未被本輪修改）：

```
npm run check:github-pages-prepublish && npm run check:github-pages-prepublish-smoke && npm run check:metadata-all && npm run validate:content
```

純 `npm run` 串接（Option A 風格），**未新增任何 `.js`**，故對 `check:npm-script-targets` 貢獻 0 target。

---

## 3. 各子檢查分工

| 子檢查 | 域 | 性質 |
| --- | --- | --- |
| `check:github-pages-prepublish` | git-state / dual-repo deploy-safety | fail-fast guard（exit 1 on unsafe repo state） |
| `check:github-pages-prepublish-smoke` | prepublish failure-branch smoke / fixtures | smoke（fixture env override） |
| `check:metadata-all` | content metadata quality suite | report-only / warning-only / exit 0 |
| `validate:content` | content validation baseline | report（error/warning/post 計數） |

串接語意刻意排序：**safety fail-fast 在前**（repo state 不安全就立刻停），**warning-only quality 在後**（metadata + content validation 不阻擋、只報數）。

### 3a. metadata suite 內部再分工

`check:metadata-all` = `check:metadata-guards && check:metadata-cross-fields`：

- `check:metadata-guards`：**5 個 single-field guard**（content-type / adsense-mode / campaign-purpose / campaign-industry / custom-promo）。
- `check:metadata-cross-fields`：**3 個 cross-field guard**（campaign-metadata / custom-promo / adsense 內部一致性）。

`check:metadata-all` 是 **metadata suite**，**不等於** release-readiness 全套（release-readiness 另含 prepublish safety + smoke + content validation）。

---

## 4. 已知 baseline（撰寫時實測）

| 子檢查 | baseline |
| --- | --- |
| `check:github-pages-prepublish` | 16/16 PASS |
| `check:github-pages-prepublish-smoke` | 8/8 PASS |
| `check:metadata-all` | 8 個 metadata guard 全 exit 0；production scanned 17 / candidates 0 / warnings 0 |
| `validate:content` | 0 error / 135 warning / 107 post |
| `check:release-readiness`（整套） | exit 0 |
| `check:npm-script-targets`（旁證） | 46/46 PASS |

`validate:content` 之 135 warning 為既有 baseline（1 production `page-noindex-in-listings` intentional hold + 其餘 `content/validation-fixtures/` 來源），**非**本 runbook 需修正之項目。

---

## 5. 使用時機

- release 前。
- GitHub Pages 發布前（作為發布動作**之前**的一鍵 gate；它本身不發布）。
- metadata / schema guard 變動後（回歸確認 metadata suite 仍 exit 0）。
- content validation baseline 需要確認時。

---

## 6. 非目標（跑這支指令**不會**做，也**不該**由它衍生）

- 不執行 deploy。
- 不 build gh-pages。
- 不修改 content / frontmatter。
- 不修正 validation warnings。
- 不回填 metadata。
- 不猜 Blogger URL / Blogger postId / Blogger publishedAt。

---

## 7. 注意事項

1. `check:metadata-guards`（single-field）與 `check:metadata-cross-fields`（cross-field）分工不同，兩者合成 `check:metadata-all`。
2. `check:metadata-all` 是 metadata suite，**不等於** release-readiness 全套。
3. `check:release-readiness` 是 top-level umbrella，**但仍不是 deploy 指令**；它只把既有 read-only 檢查串起來。
4. 若未來要在此 umbrella 加入 **build / deploy 前置檢查**，需**另開 phase + explicit approval**，不得在本 umbrella 直接塞入 build/deploy 步驟（會破壞「只做 checks」的語意分離）。
