# 第 12 章演練紀錄：平行子代理

> 快速 demo 模式，未經 QA／審查。日期：2026-10-18。Claude Code 2.1.302。

## 做了什麼

1. **示範專案** `src/`（故意埋入問題）
   - `src/api.js`：SQL 注入（字串拼接、`ORDER BY ${sortBy}`）、O(n²) 巢狀迴圈（`findCommonUsers`、`dedupeOrders`）、`err.stack` 回傳給前端、沒有任何測試
   - `src/utils.js`：`readFileSync` 同步讀大檔、`JSON.parse` 未處理例外、路徑穿越、未 catch 的 Promise、迴圈內重複 I/O
2. **專案層 agent**（`.claude/agents/`，工具都只給 `Read, Grep, Glob`）
   - `security-reviewer.md`、`performance-reviewer.md`、`test-coverage-reviewer.md`
3. **一次 `claude -p` 平行派工**，結果存成 `REVIEW-REPORT.md`
4. **`PATTERNS.md`**：Orchestrator／Pipeline／Map-Reduce 三種模式比較

## 驗證指令

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "請在同一個回應中同時平行派出 security-reviewer、performance-reviewer、test-coverage-reviewer 三個子代理審查 src/ ……只輸出報告本文，不要寫任何檔案、不要執行 git。" \
  --output-format stream-json --verbose \
  --allowedTools "Agent,Read,Grep,Glob" \
  --disallowedTools "Write,Edit,Bash,NotebookEdit"
```

- 測試 session 禁止 Write/Edit/Bash，所以報告由主 session 從 stream-json 最後一個非空的 `result` 取出，再寫成 `REVIEW-REPORT.md`
- stream-json 原始檔放在 scratchpad，沒有放進 repo

## 驗證結果

| 檢查項目 | 結果 |
| --- | --- |
| 三個子代理都有派出 | ✅ 3 個 `Agent` tool_use，`subagent_type` 分別為三個審查員 |
| 同一回合平行 | ✅ 三個 tool_use 屬於**同一則 assistant 訊息**（`msg_011Cg8w2vZa7MKx5coNcVtgB`） |
| 實際同時執行 | ✅ 三個子代理的事件在串流中交錯出現（X25s / Zf6Z / e8RH 輪流），並各有 1 個 `task_started` 與 `task_notification` |
| 完成順序 | 安全 → 效能 → 測試覆蓋（主代理每收到一份就回報一次進度，三份到齊才彙整） |
| 彙整報告 | ✅ 安全 9 項、效能 7 項、測試 11 項，共 27 項；Top 5 都是 SQL 注入與路徑穿越 |
| 埋入的問題是否都抓到 | ✅ SQL 注入 ×3、路徑穿越、stack trace 外洩、O(n²) ×2、readFileSync、JSON.parse、未 catch 的 Promise、零測試，全部命中 |
| 測試 session 沒有寫檔 | ✅ `git status` 只看到主 session 建的檔案 |
| 耗時／費用 | 約 1.5 分鐘，US$1.80（費用以 stream-json 回報的數字為準） |

額外發現：審查員還指出 `require("./db")` 對應的 `src/db.js` 不存在，這不是刻意埋的問題，但確實是對的。

## 和書上做法的差異

1. **子代理是背景執行**：這版 CLI 的 `Agent` 工具呼叫會立刻回傳「已啟動」，子代理在背景跑，完成時用 `task_notification` 通知主代理。所以 stream-json 裡有**多個 `result` 事件**（其中幾個是空的），最終報告要取最後一個非空的 `result`。書上的寫法是同步等三個 tool_result 回來，我們這次看到的流程不一樣。
2. **工具名稱**：書上可能寫 `Task` 工具，這版叫 `Agent`（解析腳本兩個名稱都接受）。
3. **報告由外部存檔**：書上可能讓 session 自己寫 `REVIEW-REPORT.md`；這次為了遵守「測試 session 禁止寫檔」，改成從輸出擷取後由主 session 存檔。
4. **PostToolUse 安全 hook**：建立 `src/*.js` 時，全域的安全 hook 擋下並警告 SQL 注入與路徑穿越。這些漏洞是演練故意埋的，所以保留不修。另外有 formatter hook 把引號改成雙引號，行號因此和原始草稿不同，但不影響審查。

## 已知未處理

- `src/` 是故意寫壞的程式，不能執行（缺 `db.js`），也不應該拿去參考
- 只跑一次驗證，沒有重測；子代理的嚴重度判定沒有逐條人工複核
