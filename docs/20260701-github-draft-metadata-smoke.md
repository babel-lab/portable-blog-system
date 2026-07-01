# GitHub Draft Metadata Smoke（direct-node）

**Phase**：20260701-a4-1（docs note）
**Script**：`src/scripts/check-github-draft-metadata.js`
**新增於**：A3-2（commit `c25afaf`，`test(content): cover github draft metadata`）
**種類**：Direct-node smoke（**非** package.json wired script），比照 CLAUDE.md
「Direct-node smoke（非 package scripts）」前例：`check-ga4-param-allowlist.js` /
`check-blogger-operator-guidance.js` / `check-platform-policy-effective.js`。

---

## 1. 用途

鎖住 build-preview-workflow GitHub draft 之 frontmatter contract，避免未來被無意破壞。

目標檔（single draft，hard-coded）：

```text
content/github/posts/2026-07-01-github-pages-build-preview-workflow.md
```

Registry 來源（read-only）：

```text
content/settings/categories.json
content/settings/tags.json
```

---

## 2. 範圍 / 邊界

- **只讀**：`readFileSync` + `gray-matter` 解析單一 draft；`JSON.parse` 讀 categories / tags registry。
- **不**寫任何檔、**不**跑 build / deploy / validate / dev server、**不**碰 gh-pages / deploy clone。
- **不** import `build-github.js` / `load-posts.js`（`loadPosts` 會過濾掉 draft、取不到本檔；且 module load 可能觸發 side effect）。改為直接 readFile + matter 解析目標檔。
- **非** package.json wired script（刻意）。以 `node src/scripts/check-github-draft-metadata.js` 直接執行。

---

## 3. 覆蓋 contract（11 條斷言）

| # | 斷言 | 說明 |
| --- | --- | --- |
| 1 | frontmatter 解析為 plain object | 非陣列、非 null |
| 2 | `site === "github"` | |
| 3 | `primaryPlatform === "github"` | |
| 4 | `contentKind` 為合法列舉值 | CLAUDE.md §11：`post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page` |
| 5 | `title` / `titleEn` / `slug` 皆非空字串 | |
| 6 | `category` registry-bound + site[] 含 `github` | 命中 `categories.json` 之 `id` 或 `slug`，且該 entry `site[]` 含 `github` |
| 7 | `tags` 為非空陣列 | |
| 8 | 每個 tag registry-bound + site[] 含 `github` | 命中 `tags.json` 之 `id` 或 `slug`，且各 entry `site[]` 含 `github` |
| 9 | 無紅線禁用 / 不存在 tag | forbidden set：`admin-ui` / `design-token` / `blogger` / `download` / `markdown` |
| 10 | draft contract 一致 | `status === "draft"` **且** `draft === true` |
| 11 | `publishTargets.github.enabled === true` | |

任一斷言失敗即 `process.exit(1)`；尾端印 `check-github-draft-metadata: <pass> / <fail>`。

---

## 4. 何時手動執行

以下情況手動跑一次，確認 11/0 PASS：

- 修改 build-preview-workflow GitHub draft frontmatter 後（category / tags / status / draft / publishTargets 等）。
- 調整 `categories.json` / `tags.json` registry 之 `site[]` 或增刪 entry 後（可能連帶影響 registry-bound 斷言）。
- 該 GitHub draft 由 draft 轉往 ready / published 前（先確認 metadata contract 完整，再走發布流程）。

指令：

```bash
node src/scripts/check-github-draft-metadata.js
```

預期輸出：

```text
check-github-draft-metadata: 11 / 0
```

搭配全站回歸（非本 smoke 一部分，但建議一併確認 baseline 未回退）：

```bash
npm run validate:content     # 預期 0 error / 134 warning / 106 post(s)
```

---

## 5. 邊界說明

- 本 smoke **不進** `validate:content` / `report:validation` baseline，**不進** package.json scripts；屬 direct-node regression net，與上述 3 支既有 direct-node smoke 同一類別。
- 本 note 為 docs-only，**不**改 CLAUDE.md、**不**改 package.json、**不**改 script 本身、**不**改 content / registry。
- 是否未來 wire 進 package.json（A4-2）為獨立決策，須另開 phase + user explicit approval；目前刻意維持 non-wired 以與既有 direct-node smoke 慣例一致。
