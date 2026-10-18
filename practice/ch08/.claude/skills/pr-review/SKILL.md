---
name: pr-review
description: 審查 PR／分支的程式碼品質，找出 bug、安全漏洞、缺少的錯誤處理與測試，輸出問題清單與嚴重度。Use when the user asks to review, check, audit, or find problems in a PR's code（「幫我看這個 PR 有沒有問題」「review 這個 PR」「這段改動有 bug 嗎」）。Not for：撰寫 PR 標題／說明文字（請改用 pr-description）、寫 commit message（請改用 commit-message）。
---

# PR Review（審查程式碼）

職責：**判斷程式碼對不對**，不負責寫說明文字。

1. 用 `git diff <base>...HEAD` 取得變更（base 預設 main/master）；若目前就在 base 分支上，改用 `git show HEAD`。
2. 逐檔檢查：正確性、錯誤處理、安全性、測試覆蓋。
3. 輸出：

   | 嚴重度 | 檔案:行 | 問題 | 建議 |
   | --- | --- | --- | --- |

4. 結論：APPROVE 或 CHANGES_REQUESTED。只讀不改檔。
