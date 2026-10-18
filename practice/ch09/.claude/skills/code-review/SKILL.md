---
name: code-review
description: 對指定檔案或目前 diff 做一般性程式碼審查，依嚴重度列出問題（必改／建議／備註）並附行號。觸發：幫我 review、審查這段程式、code review。不適用：SQL 專項審查（用 sql-review）、直接動手重構（用 refactor-helper）、追特定 bug（用 debug-helper）。只回報，不修改檔案。
---
# code-review
1. 讀目標檔案或 `git diff`。
2. 檢查：正確性、邊界值、錯誤處理、安全、可讀性。
3. 輸出表格：嚴重度｜檔案:行號｜問題｜建議修法。
4. 不修改任何檔案。
