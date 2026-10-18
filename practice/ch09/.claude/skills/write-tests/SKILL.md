---
name: write-tests
description: 替指定的 JavaScript/Node 模組產生 node:test 單元測試（正常、邊界、錯誤三類案例），寫入 test/ 目錄並執行 `node --test` 回報結果。觸發：寫測試、補單元測試、產生測試、write tests。不適用：解讀測試失敗的錯誤（用 explain-error）、修正被測程式（用 debug-helper）。不修改被測的原始碼。
---
# write-tests
1. 讀目標模組，列出要測的函式與預期行為（依函式名稱與註解推斷「正確」行為，不要遷就現有實作）。
2. 寫 `test/<模組名>.test.js`，使用 `node:test` 與 `node:assert/strict`，至少涵蓋：正常、邊界（空輸入）、錯誤（非法輸入）。
3. 執行 `node --test`，回報通過／失敗數與失敗訊息。
4. 測試失敗時不要改原始碼，只回報。
