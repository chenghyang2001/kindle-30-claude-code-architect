# 八位專家一覽（第 13 章）

定義檔位置：`.claude/agents/<name>.md`（專案層）

| 專家 | 職責 | tools | model | 派工時機 |
| --- | --- | --- | --- | --- |
| code-reviewer | 正確性、可讀性、慣例審查（只讀） | Read, Grep, Glob | sonnet | 功能寫完、PR 送出前 |
| security-auditor | OWASP 弱點稽核（只讀） | Read, Grep, Glob | sonnet | 碰到輸入、認證、機密、SQL、外部指令 |
| test-writer | 寫 node:test 測試並執行 | Read, Write, Edit, Bash, Glob | sonnet | 新程式沒測試、修 bug 前先寫重現測試 |
| debugger | 重現 → 假設 → 驗證 → 根因（預設不改檔） | Read, Grep, Glob, Bash | sonnet | 錯誤、例外、測試失敗、結果不符預期 |
| refactorer | 只改結構不改行為，前後跑測試 | Read, Edit, Grep, Glob, Bash | sonnet | 重複、太長、巢狀深、命名含糊 |
| doc-writer | README / API / JSDoc | Read, Write, Edit, Glob | haiku | 新功能完成後補文件 |
| performance-optimizer | 先量測再優化（預設不改檔） | Read, Grep, Glob, Bash | sonnet | 變慢、大資料、複雜度評估 |
| architect | 模組切分、方案比較、實作順序（只讀） | Read, Grep, Glob | sonnet | 跨 3+ 模組、技術選型、大任務拆解 |

## 設計原則

- **最小權限**：只讀型（reviewer / security / architect）不給 Write、Edit、Bash；需要執行的才給 Bash；會產檔的才給 Write。
- **模型分級**：需要推理的用 sonnet；文件這類格式化工作用 haiku 省成本。
- **固定輸出格式**：每位專家的系統提示都規定輸出段落，方便主代理整合結果。

## 典型串接

```
architect → (實作) → test-writer → debugger（測試失敗時）→ refactorer → code-reviewer → security-auditor → doc-writer
```
