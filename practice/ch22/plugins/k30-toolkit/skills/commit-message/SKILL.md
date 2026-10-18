---
name: commit-message
description: 依 staged diff 產生繁體中文 commit message（格式：動詞 + 簡短說明）。觸發：寫 commit message、幫我寫 commit 訊息、commit-message。
---

# commit-message

1. 執行 `git diff --cached --stat` 與 `git diff --cached` 了解改動。
2. 產生一行標題：`<動詞><簡短說明>`，動詞限「新增／修復／重構／更新／移除／合併」，不超過 50 字。
3. 改動超過一個面向時，空一行後用條列補充細節。
4. 只輸出 commit message 文字，不要自己執行 `git commit`。
