# 第 04 章「SKILL.md 解剖」演練筆記

> 快速 demo 模式（未經 QA／審查）。日期：2026-10-18，Claude Code 2.1.302。

## 做了什麼

| 項目 | 路徑 | 說明 |
| --- | --- | --- |
| Skill 1 | `.claude/skills/pr-description/SKILL.md` | 依 git diff 產 PR 描述（摘要／變更／測試／風險） |
| Skill 2 | `.claude/skills/explain-codebase/SKILL.md` | `allowed-tools: Read, Grep, Glob`，產架構摘要 |
| Skill 3 | `.claude/skills/sql-review/SKILL.md` | 審 SQL：注入、索引、N+1、LIKE 前導萬用字元、SELECT *、無 LIMIT |
| 被分析程式碼 | `src/server.js`、`src/db.js`、`queries.sql` | Express + pg；**刻意**埋了 2 個注入、1 個 N+1、全表無索引 |
| 產出 1 | `ARCH-SUMMARY.md` | explain-codebase 的結果 |
| 產出 2 | `SQL-REVIEW.md` | sql-review 的結果 |

每個 SKILL.md 都照書上的結構：**frontmatter → 步驟 → 輸出格式 → 範例**。

## frontmatter 各欄位的作用

| 欄位 | 作用 | 寫法重點 |
| --- | --- | --- |
| `name` | skill 的識別名，也是 `/name` 指令名與 `Skill` 工具呼叫的參數 | 小寫＋連字號，和資料夾名一致 |
| `description` | **決定何時觸發**。Claude 啟動時只載入每個 skill 的 name + description，靠它判斷要不要載入全文 | 寫「做什麼＋何時用（觸發詞）＋不用於什麼」 |
| `allowed-tools` | skill 啟用期間**免詢問就能用**的工具 | 見下方實測：它是「預先放行」，不是「禁止其他工具」 |

本文（步驟／輸出格式／範例）只有在 skill 被觸發時才載入 context，這就是「漸進式揭露」。

## 驗證方式與結果

用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "..." --output-format stream-json --verbose` 開新 session，從 JSON 事件流確認有沒有呼叫 `Skill` 工具。

| 測試 | prompt | 結果 |
| --- | --- | --- |
| A. 三個 skill 是否被載入 | （init 事件） | ✅ `skills` 清單含 explain-codebase / pr-description / sql-review |
| B. 指名觸發 | 「請用 explain-codebase skill 分析…」 | ✅ 呼叫 `Skill(explain-codebase)`，之後只用 Glob＋Read，7 turns，產出 → `ARCH-SUMMARY.md` |
| C. **不指名**、靠 description 觸發 | 「請審查 queries.sql 這個檔案的 SQL 問題」 | ✅ 自動呼叫 `Skill(sql-review)`，抓到 🔴2／🟡5／🟢3，含 db.js:8、db.js:27 注入與 N+1 → `SQL-REVIEW.md` |
| D. 唯讀限制是否擋得住寫檔 | 「用 explain-codebase 分析並用 Write 寫入 probe-write.md」 | ⚠️ **沒擋住**：Write 成功、`permission_denials: []`（session 為 `auto` 權限模式）。測試檔已刪 |

pr-description 只建立未實測（專案沒有分支與 diff 可描述）。

## 和書上做法的差異／學到的事

1. **`allowed-tools` 不是沙箱**：書上把它當「限制這個 skill 只能用哪些工具」。實測（測試 D）它的實際語意是「這些工具免詢問」，在 auto／bypass 權限模式下其他工具照樣能用。要真正唯讀，得搭配 `settings.local.json` 的 `permissions.deny`，或改用 subagent 的 `tools:` 白名單。
2. **description 寫觸發詞有效**：測試 C 沒提 skill 名稱，Claude 依 description 裡的「審查 SQL／看 .sql 檔」自動選中 sql-review。
3. 本練習的 skill 全放專案層 `./.claude/skills/`，沒動全域 `~/.claude/`；沒建 repo、沒 push。
4. 驗證用 `stream-json` 解析 `tool_use` 事件，比只看最後文字可靠（能確定 skill 真的被呼叫，而不是 Claude 自己憑空寫）。
