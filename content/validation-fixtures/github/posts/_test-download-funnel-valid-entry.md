---
title: "[validation-fixture] downloadFunnel valid entry page"
slug: "test-download-funnel-valid-entry"
status: "ready"
date: "2026-06-25"
contentKind: "post"
category: "tech-note"
tags:
  - "github"
cover: "/images/placeholders/cover.png"
description: "Fixture：合法 funnel entry（role=entry + targetGatedPage 指向 gated_page fixture）→ reciprocate → downloadFunnel 0 觸發。"
downloadFunnel:
  role: "entry"
  targetGatedPage: "test-download-funnel-valid-gated-page"
---

本 fixture 代表合法 funnel **entry page**（前導 / SEO landing）：

- `downloadFunnel.role: entry`、`targetGatedPage` 指向 gated_page fixture 之 slug（simple slug，非 Drive/Form/token）。
- 對應之 gated_page fixture 之 `entryPages` 列回本頁 slug → bidirectional reciprocity 一致。

預期 downloadFunnel validator 行為：**0 warning**（無 required-combo / private-value / bidirectional 觸發）。位於 `content/validation-fixtures/github/posts/`，僅供 `validate-content` 掃描。
