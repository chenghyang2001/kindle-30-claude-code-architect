---
name: release-prep
description: 發版前整套準備流程（meta-skill），依序串接 pr-review → commit-message → pr-description。Use when the user asks to prepare a release or 「準備發 PR／收尾這個分支／發版前檢查」 that needs review + commit + PR 說明一次做完。Not for：只要其中一步（請直接用 pr-review、commit-message 或 pr-description）。
---

# Release Prep（meta-skill）

本 skill 不自己做事，只負責**編排順序**與**關卡**。

## 流程

1. **pr-review**：審查目前分支變更。
   - 結論為 CHANGES_REQUESTED（有高嚴重度問題）→ **停止**，列出問題請使用者先修。
2. **commit-message**：若有未提交變更，產生提交訊息，待使用者同意後 commit。
3. **pr-description**：根據最終分支內容產生 PR 標題與說明。

## 輸出

最後彙整三段結果：審查結論、commit 訊息、PR 說明。不 push、不建立 PR。
