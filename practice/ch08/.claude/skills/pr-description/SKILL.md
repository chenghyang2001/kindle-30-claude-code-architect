---
name: pr-description
description: 撰寫 PR 的標題與說明文字（摘要、變更清單、測試方式），供貼到 GitHub PR body。Use when the user asks to write, draft, or generate a PR description／PR 說明／PR 標題（「幫我寫 PR 說明」「產生 PR body」）。Not for：審查程式碼或找 bug（請改用 pr-review）、寫 commit message（請改用 commit-message）。
---

# PR Description（撰寫描述）

職責：**把變更寫成給人看的說明**，不評論程式碼好壞。

1. 用 `git log <base>..HEAD --oneline` 與 `git diff --stat <base>...HEAD` 了解變更；若目前就在 base 分支上，改用 `git show --stat HEAD`。
2. 產出 Markdown：

   ```
   ## 標題
   ## 摘要（為什麼改）
   ## 變更清單
   ## 測試方式
   ```

3. 只輸出文字，不建立 PR、不 push。
