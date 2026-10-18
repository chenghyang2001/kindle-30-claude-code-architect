---
name: commit-message
description: 根據已 staged 的變更撰寫 git commit message（繁體中文，「動詞 + 簡短說明」格式）。Use when the user asks for a commit message, 提交訊息, or wants to commit staged changes. Not for：PR 說明（請改用 pr-description）、審查程式碼（請改用 pr-review）。
---

# Commit Message

1. 執行 `git diff --staged`；若無 staged 變更，提示使用者先 `git add`，然後停止。
2. 判斷變更類型，選動詞：新增／修復／重構／更新／移除。
3. 產出格式：

   ```
   <動詞><簡短說明（≤ 50 字）>

   - 重點變更 1
   - 重點變更 2
   ```

4. 只輸出訊息供使用者確認；使用者明確同意後才執行 `git commit`。
