---
title: "[validation-fixture] download formRef not found in registry"
slug: "test-download-form-ref-not-found"
status: "ready"
draft: false
date: "2026-06-02"
description: "Phase 20260602-night-9 R2 fixture：故意觸發 download-form-ref-not-found warning（registry-aware lookup miss case）。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
download:
  enabled: true
  fileUrl: "https://example.com/forms/not-found-form.pdf"
  formRef: "nonexistent-form-id"
---

本 fixture 故意設計 download.formRef 指向一個未登錄於 `content/settings/download-forms.json` 的 formId → 觸發 `download-form-ref-not-found`。

formRef 為 非空 trimmed string，通過 invalid-type / empty 分支後進入 registry-aware lookup，於空 registry（forms: []）中找不到對應 formId 故觸發 not-found（互斥分支 cascade：invalid-type → empty → not-found）。

fileUrl + seo.indexing 設定避免同時觸發 D1 / D2 / D3 / S；本 fixture 預期只觸發單一 R2 warning。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
