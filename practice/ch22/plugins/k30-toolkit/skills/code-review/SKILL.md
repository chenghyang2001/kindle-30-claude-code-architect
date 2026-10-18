---
name: code-review
description: 對目前改動做精簡 code review，依嚴重度列出問題。觸發：幫我 review、code review、審查這段程式。
---

# code-review

1. 讀 `git diff`（未指定時）或使用者指定的檔案。
2. 依三級列出：🔴 必改（bug／安全）、🟡 建議（可讀性／效能）、🟢 備註。
3. 每項附 `檔案:行號` 與一句修正建議。
4. 唯讀審查，不修改任何檔案。
