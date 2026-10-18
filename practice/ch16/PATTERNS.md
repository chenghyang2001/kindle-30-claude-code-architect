# 第 16 章 Hook 設計模式：四種模式

設定檔：`.claude/settings.json`（專案層）；腳本：`.claude/hooks/*.js`（Node，不依賴 jq）。

## 總覽

| 模式 | 事件 | 用途 | 控制方式 | 範例腳本 |
| --- | --- | --- | --- | --- |
| Gate（閘門） | `Stop` | 「條件不成立就不准收工」——測試沒過就要 Claude 繼續修 | stdout 回傳 `{"decision":"block","reason":...}` | `gate.js` |
| Guard（守衛） | `PreToolUse`（matcher `Bash`） | 在工具執行**前**攔下危險操作 | `exit 2`＋stderr 理由（回饋給 Claude） | `guard.js` |
| Pipeline（管線） | `PostToolUse`（matcher `Write\|Edit`） | 寫檔**後**依序跑多個步驟（格式化 → log），前一步失敗就中斷 | exit 0；失敗時 exit 1（非阻擋，只提示） | `pipeline.js` |
| 背景（Async） | `PostToolUse`＋`"async": true` | 慢且不影響結果的副作用（通知、統計、上傳），不拖慢主流程 | 不回傳決策，跑完就結束 | `async-bg.js` |

## 各模式重點

### 1. Gate — `gate.js`
- 先檢查 `stop_hook_active`：為 `true` 代表這次 Stop 已經是被擋過之後的再嘗試，直接放行，**避免無限迴圈**。
- 掃描 `*.test.js` / `*.spec.js`（略過 `node_modules`、`.git`、`.claude`）；沒有測試檔就放行。
- `node --test` 失敗 → 把輸出最後 30 行塞進 `reason`，Claude 會看到並繼續工作。
- 掃描出錯時選擇「放行」（fail-open），寧可少擋一次，也不讓 Stop hook 卡死 session。

### 2. Guard — `guard.js`
- 偵測 `rm -rf`、`rm -fr`、`rm -Rf`、`rm -r -f`、`rm --recursive --force`。
- `exit 2` 時 stderr 會變成給 Claude 的回饋，工具呼叫不會執行。

### 3. Pipeline — `pipeline.js`
- 步驟陣列 `[['format', fn], ['log', fn]]` 依序執行，前一步的結果傳給下一步（log 會記錄 `format=formatted/unchanged/skip`）。
- 格式化器是內建簡易版（本機沒有 prettier）：`.json` 重新縮排；`.js/.md/.txt` 等去行尾空白、CRLF→LF、結尾一個換行。
- 任一步丟例外就寫 `FAILED at <步驟>` 並中斷。

### 4. 背景 — `async-bg.js`
- 記錄 `start`，`setTimeout` 3 秒後寫 `start/end` 到 `async.log`。
- 與同步的 Pipeline 掛在同一個 matcher，可直接比較兩者對主流程的影響。

## 實測結果對照表

| 模式 | 直接餵 JSON | `claude -p` 實測 | 結論 |
| --- | --- | --- | --- |
| Gate | 無測試→exit 0；失敗測試→輸出 `decision:block`；`stop_hook_active:true`→不輸出、放行 | 第 1 次 Stop 被擋 → Claude 讀檔、把 `a - b` 改成 `a + b` → 第 2 次 Stop `stop_hook_active=true` 放行；之後 `node --test` pass 1 / fail 0 | ✅ 符合預期，只擋一輪 |
| Guard | 4 種 rm -rf 寫法 exit 2；`rm a.txt`、`ls -la` exit 0 | Claude 呼叫 `rm -rf ./guard_target` → tool_result 為 `[Guard] 已阻擋危險指令`；目錄仍在 | ✅ 符合預期（也在主 session 中誤擋了含 `rm -rf` 字串的測試指令） |
| Pipeline | `a = 1   \r\n…\n\n\n` → `a = 1\nb = 2\n`；JSON 重排；log 各 1 行 | 寫 `demo/a.js`、`demo/b.js` → 行尾空白與多餘空行被刪、pipeline.log 依序 2 行 | ✅ 符合預期 |
| 背景 Async | 直接執行耗時 3136 ms（腳本本身確實睡 3 秒） | Write 的 tool_result 在 `03:08:16.814` 回到模型；async.log `end=03:08:19.779`（晚約 3 秒）；同步 Pipeline 在 `03:08:16.774` 已完成 | ✅ CLI 2.1.302 支援 `async`，不阻塞主流程 |
