---
name: pr-description
description: 依分支與主線的差異（git log + git diff main...HEAD）撰寫 Pull Request 描述：摘要、變更清單、測試方式、風險。觸發：寫 PR 描述、PR 說明、pull request body。不適用：單一 commit 訊息（用 commit-message）、審查程式碼（用 code-review）。只產出文字，不建立 PR。
---
# pr-description
1. 讀 `git log main..HEAD --oneline` 與 `git diff main...HEAD --stat`。
2. 輸出 Markdown：`## 摘要`、`## 變更`、`## 測試方式`、`## 風險與回滾`。
3. 不呼叫 gh、不建立 PR。
