# 第 13 章「八位專家」快速演練筆記

> 快速 demo 模式：未經 QA／審查流程，每個驗證只跑一次。日期：2026-10-18

## 做了什麼

1. 在專案層 `.claude/agents/` 建立 8 個專家：code-reviewer、security-auditor、test-writer、debugger、refactorer、doc-writer、performance-optimizer、architect。
   每個都有 `name`、`description`（何時派）、最小必要 `tools`、`model`、系統提示（職責＋固定輸出格式）。
2. `AGENTS-INDEX.md`：8 位專家一覽表（職責／tools／model／派工時機）＋設計原則＋典型串接順序。
3. 素材 `src/math.js`：刻意埋 2 個 bug（`average` 迴圈從 1 開始、`max` 初值寫死 0），原本沒有測試。
4. 用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ... --output-format stream-json --verbose` 開新 session 實際派工 2 位專家（兩個 session 平行跑）。

## 驗證結果

| 驗證 | 測試 session 限制 | 子代理是否派出 | 結果 |
| --- | --- | --- | --- |
| debugger | `--disallowedTools Write,Edit,NotebookEdit,Bash(git commit:*)` | ✅ 主 session 呼叫 `Agent(subagent_type="debugger")`；之後的 Read、Bash（`node -e`）都帶 `parent_tool_use_id` → 在子代理內執行 | ✅ 指出 `src/math.js:7` 迴圈從 `i = 1` 開始漏加第一個元素、`src/math.js:20` 的 `best = 0` 讓全負數陣列回傳 0；還補充空陣列與輸入檢查的風險。未改任何檔案 |
| test-writer | `--permission-mode acceptEdits`＋只允許 `Bash(node:*)`，禁止 git commit | ✅ `Agent(subagent_type="test-writer")`；子代理 Write `test/math.test.js` 後執行 `node --test` | ✅ 寫了 12 個測試（average 4、sumTo 4、max 4），首次執行 **6 過／6 敗**，失敗剛好對應兩個 bug；沒有改 `src/`，也沒有 commit |

收尾：主 session 依 debugger 的建議改 2 行（`i = 0`、`best = -Infinity`），重跑 `node --test` → **12／12 通過**。

### 觀察

- stream-json 中子代理的工具呼叫會帶 `parent_tool_use_id`，這是判斷「真的有派出子代理」最可靠的證據。
- 子代理結束時會呼叫 `SubagentHandback` 把結果交回主代理（debugger 那次可以看到）。
- 兩個 session 平行跑時，debugger 看到 test-writer 剛建的 `test/` 目錄，回報「不知道是誰建的」：共用工作目錄時，平行 session 會互相看到對方的產出。

## 和書上做法的差異

- 8 位專家名單照題目指定的名稱建立；書上的名稱或分工若有不同，以這 8 個為準。
- model 只用 sonnet／haiku（只有 doc-writer 用 haiku），沒有用 opus；architect 若要更強推理，可改 `model: opus`。
- 驗證改用 `claude -p` 非互動模式，並用 `--disallowedTools`／`--allowedTools` 限制測試 session 的權限；書上多半是在互動 session 裡直接請 Claude 派工。
- 測試框架用 Node 內建 `node:test`，不安裝 Jest／Vitest，零依賴。
- 修 bug 這步由主 session 直接做，沒有另外派 refactorer 或 debugger 修改。

## 已知未處理

- `average([])` 回傳 `NaN`、`max([])` 回傳 `-Infinity`、`sumTo` 沒檢查負數：這次刻意不處理，也沒有對應測試。
- 其餘 6 位專家只建了定義，沒有實際派工驗證。
