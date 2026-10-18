---
name: refactor-helper
description: 在不改變行為的前提下重構指定程式碼（抽函式、改命名、去重複、降巢狀）。Use when the user asks to refactor, clean up, or simplify existing code（「幫我重構」「這段太亂整理一下」）。Not for：找 bug／審查（請改用 pr-review）、新增功能。
---

# Refactor Helper

1. 先讀目標程式碼，列出異味（過長函式、重複、巢狀 > 3 層、命名含糊）。
2. 若有測試，重構前先跑一次記錄基準。
3. 小步重構，每步保持行為不變。
4. 重構後再跑測試確認結果一致。
5. 用 `git diff` 摘要改了什麼。

## 最後一步（技能接棒）

重構完成後，一律在回覆結尾提示：

> ✅ 重構完成。接著用 **commit-message** skill 產生提交訊息（先 `git add` 要提交的檔案）。

不要自己寫 commit message、也不要自己 commit——交棒給 commit-message。
