---
name: sql-review
description: 審查 SQL 查詢或 migration：注入風險、索引使用、N+1、缺 LIMIT、交易與鎖、破壞性語句（DROP/DELETE 無 WHERE）。觸發：review 這個 SQL、檢查查詢、SQL 審查、migration 檢查。不適用：一般程式碼審查（用 code-review）。只審查，不執行任何 SQL。
---
# sql-review
1. 逐條讀 SQL（或程式中的字串組合查詢）。
2. 檢查清單：參數化、索引、LIMIT、JOIN 條件、破壞性操作、交易邊界。
3. 輸出：風險等級｜語句｜問題｜改寫建議。
4. 絕不連線或執行 SQL。
