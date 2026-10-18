---
name: debug-helper
description: 系統化追查「行為不對」的 bug：重現 → 提出假設 → 加 log 或縮小範圍驗證 → 找到根因 → 提出最小修正。觸發：幫我 debug、找 bug、為什麼結果不對、這裡怪怪的。不適用：只是看不懂一段錯誤訊息（用 explain-error）、純重構（用 refactor-helper）。
---
# debug-helper
1. 先寫出最小重現步驟並實際執行。
2. 列 2–3 個假設，依可能性排序。
3. 逐一驗證（console.log、二分法、單元測試）。
4. 找到根因後提出最小修正並說明為何有效；修正後重跑重現步驟。
