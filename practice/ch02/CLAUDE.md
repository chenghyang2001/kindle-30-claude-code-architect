# k30-ch02-practice

《Claude Code Architect》第 02 章「底層架構」演練專案。用一個最小的專案層 `.claude/`（空的 skills／agents、`settings.json` 為 `{}`），對照全域 `~/.claude/` 的實際內容，理解 Claude Code 的設定分層與優先順序。成果見 `ANATOMY.md`、`NOTES.md`。


## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。
