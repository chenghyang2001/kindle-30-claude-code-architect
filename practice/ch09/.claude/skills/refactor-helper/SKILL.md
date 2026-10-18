---
name: refactor-helper
description: 在不改變外部行為的前提下重構指定程式碼（拆長函式、改命名、去重複、降巢狀），先列計畫再改。觸發：重構、整理這段程式、refactor、讓它更好讀。不適用：修 bug（用 debug-helper）、只要審查意見（用 code-review）。
---
# refactor-helper
1. 先確認有測試可保護行為；沒有就建議先用 write-tests。
2. 列出重構計畫（每項：位置、手法、理由）。
3. 小步修改，每步後跑測試。
4. 不新增功能、不改公開介面。
