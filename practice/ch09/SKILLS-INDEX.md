# 第 09 章：十個核心 Skill 一覽

位置：`./.claude/skills/<名稱>/SKILL.md`（專案層，不碰全域 `~/.claude/`）

| # | 名稱 | 何時用 | 不適用（改用） | 輸出 |
|---|------|--------|----------------|------|
| 1 | commit-message | 已 staged，要一則提交訊息 | PR 描述（pr-description）、版本紀錄（changelog-entry） | 一則繁中 commit message（不執行 commit） |
| 2 | pr-description | 分支要發 PR，需要說明 | 單一 commit（commit-message）、審查（code-review） | Markdown：摘要／變更／測試／風險 |
| 3 | code-review | 想要一般性審查意見 | SQL 專項（sql-review）、動手重構（refactor-helper）、追 bug（debug-helper） | 問題表：嚴重度｜行號｜問題｜建議（不改檔） |
| 4 | explain-error | 手上有一段看不懂的錯誤訊息 | 需要重現、多輪追查（debug-helper） | 錯在哪／為什麼／建議修法（不改檔） |
| 5 | write-tests | 要替模組補單元測試 | 解讀失敗（explain-error）、修原始碼（debug-helper） | `test/*.test.js` ＋ `node --test` 結果 |
| 6 | refactor-helper | 行為不變、想讓程式更好讀 | 修 bug（debug-helper）、只要意見（code-review） | 重構計畫＋小步修改 |
| 7 | api-docs | 要替匯出函式／端點寫文件 | 版本紀錄（changelog-entry）、PR 說明（pr-description） | Markdown API 文件 |
| 8 | sql-review | 審查 SQL 查詢或 migration | 一般程式碼（code-review） | 風險表＋改寫建議（不執行 SQL） |
| 9 | debug-helper | 行為不對，要找根因 | 只看不懂錯誤（explain-error）、純重構（refactor-helper） | 重現→假設→驗證→最小修正 |
| 10 | changelog-entry | 要整理版本變更紀錄 | 單一 commit（commit-message）、PR（pr-description） | Keep a Changelog 條目 |

## 邊界設計重點

- **錯誤三兄弟**：explain-error（只解讀一段錯誤）→ debug-helper（主動追查、會改碼）→ write-tests（產生測試）。
- **文字三兄弟**：commit-message（一次提交）→ pr-description（一條分支）→ changelog-entry（一個版本）。
- **審查三兄弟**：code-review（一般）／sql-review（SQL 專項）／refactor-helper（真的動手改）。
- 每個 description 都寫「觸發詞＋不適用＋改用誰」，讓模型自動選 skill 時不會撞名。
