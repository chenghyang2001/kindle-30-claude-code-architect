---
name: commit-message
description: 依目前 staged 的 git diff 產生一則繁體中文 commit message（動詞＋簡短說明，必要時附條列內文）。觸發：寫 commit message、幫我寫提交訊息、commit 訊息。不適用：PR 描述（用 pr-description）、版本變更紀錄（用 changelog-entry）。只輸出訊息文字，不自動執行 git commit。
---
# commit-message
1. 執行 `git diff --staged`（沒有 staged 就看 `git diff`）。
2. 第一行：`動詞 + 簡短說明`（新增／修復／重構／更新／移除），≤ 50 字。
3. 空一行後，用 2–5 個條列說明「為什麼改」。
4. 只輸出訊息，不執行 commit。
