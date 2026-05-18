---
title: "[validation-fixture] legacy top-level canonicalUrl"
slug: "test-legacy-canonical-url"
status: "ready"
draft: false
date: "2026-05-18"
description: "Phase 8-h-c-pre-1 fixture：故意在 .md frontmatter 放 top-level canonicalUrl 與 canonical URL string；用以保護 Phase 8-h-d-3 / 8-h-d-4 退場批之 regression。"
contentKind: "post"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags:
  - "book"
cover: "/images/placeholders/cover.png"
canonical: "https://example.com/blogger/legacy-canonical"
canonicalUrl: "https://example.com/blogger/legacy-canonical-top-level"
---

本 fixture 故意設定：

- `canonical: "https://example.com/..."`（URL string；**非** `'auto'`；per Phase 8-a 已遷移至 `.publish.json` 之 `canonical.url`）
- 頂層 `canonicalUrl: "https://example.com/..."`（per Phase 8-a 已遷移至 `.publish.json`）

**無對應 `.publish.json` sidecar**：因此 normalize / resolve-placeholders 之 nested 路徑找不到 sidecar 值；走 frontmatter legacy 分支。

對應 `docs/phase-8h-c-pre-plan.md` §3.2 位置 #9 + #17：

- **#9** `normalize-post-output.js` line 674-688 `seo.canonicalUrl` 之 `frontmatter.canonical` URL string fallback（非 `'auto'`）→ 觸發
- **#17** `resolve-placeholders.js` line 137-140 `getCanonicalUrl` step 3：`post.canonicalUrl` → 觸發

對 Phase 8-h-d-3（normalize canonical legacy fallback 退場）+ Phase 8-h-d-4（resolve-placeholders canonical 退場）之 regression 用途：

- 退場前：本 fixture 之 normalize 輸出 `normalized.seo.canonicalUrl = "https://example.com/..."`（從 frontmatter）；resolve-placeholders 之 `{canonicalUrl}` 解析至 top-level legacy
- 退場後：兩者皆 unresolved（無 sidecar + 無 legacy fallback）
- 行為差異可作為退場是否完整之驗證點

validate 階段預期 0 new warning：
- `canonical` URL 通過 `VALID_CANONICAL_RE = /^https?:\/\//` → `invalid-canonical` 不觸發
- 無針對 top-level `canonicalUrl` 之 deprecated frontmatter 規則
- `sidecar-frontmatter-overlap` 不觸發（無 `.publish.json` 存在）

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:*` 掃到。
