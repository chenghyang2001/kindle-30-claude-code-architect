# 第 15 章 Hooks 基礎 — 快速演練筆記

> 快速 demo 模式：未經 QA／審查。每項驗證只跑一次（block_env 的 Windows 路徑案例因測試字串跳脫問題補測一次）。

## 做了什麼

| 檔案 | 用途 |
| --- | --- |
| `.claude/settings.json` | 專案層 hook 設定（PreToolUse + PostToolUse） |
| `.claude/hooks/format.py` | PostToolUse：Write/Edit 後格式化 `.py`（ruff format，沒有就去行尾空白＋補結尾換行）、`.js`（`npx --no-install prettier`，沒有就去行尾空白） |
| `.claude/hooks/block_env.py` | PreToolUse：檔名是 `.env` 或 `.env.*` 就 stderr 印原因並 exit 2 |
| `.env` | 假機密 `SECRET=dummy`（已列入 `.gitignore`，不 commit） |
| `messy.py` | 含行尾空白與 tab 空行的測試檔 |

hook 指令用 `python "$CLAUDE_PROJECT_DIR/.claude/hooks/xxx.py"`，不硬編碼路徑。

## 觀念整理

### Hook 事件
- **PreToolUse**：工具執行**前**觸發，可以擋下這次呼叫（守門員）。
- **PostToolUse**：工具執行**成功後**觸發，工具已經做完，不能撤銷，適合做格式化、lint、記錄等善後。
- 其他常見事件：UserPromptSubmit、Stop、SubagentStop、SessionStart、Notification、PreCompact。

### matcher
- 用工具名稱比對，支援正規表示式：`Write|Edit` 表示 Write 或 Edit 都觸發；`*` 或留空是全部工具。
- 只對 PreToolUse／PostToolUse 這類跟工具有關的事件有意義。

### exit code
| exit | 意義 |
| --- | --- |
| 0 | 成功／放行。stdout 一般只出現在 transcript（UserPromptSubmit、SessionStart 例外，會加入 context） |
| 2 | **阻擋**。stderr 會回饋給 Claude 當原因；PreToolUse 會取消工具呼叫，PostToolUse 只能把訊息回給 Claude（工具已執行） |
| 其他 | 非阻擋錯誤：stderr 顯示給使用者，流程繼續 |

（進階：也可以 exit 0 並在 stdout 輸出 JSON，例如 `hookSpecificOutput.permissionDecision: "deny"`，做更細的控制。）

### stdin JSON 主要欄位
```json
{
  "session_id": "...",
  "transcript_path": "...jsonl",
  "cwd": "專案目錄",
  "hook_event_name": "PreToolUse",
  "tool_name": "Read",
  "tool_input": { "file_path": "C:\...\.env" },
  "tool_response": { "...": "只有 PostToolUse 才有" }
}
```
本練習只用到 `tool_name` 與 `tool_input.file_path`。

## 驗證結果

### 1. 直接餵 JSON 給腳本
| 案例 | 結果 |
| --- | --- |
| format.py + 含行尾空白的 .py 複本 | ✅ exit 0，`ruff format` 清掉行尾空白、補兩行空行 |
| format.py + 雜亂 .js | ✅ exit 0，本機有 prettier，格式化成功 |
| block_env.py + `/x/.env.local`（Edit） | ✅ exit 2，stderr 印出阻擋原因 |
| block_env.py + `C:\x\.env`（Read） | ✅ exit 2（第一次用 echo 送 JSON 時反斜線被吃掉、JSON 不合法；改用 Python 產生 JSON 後通過） |
| block_env.py + `messy.py` | ✅ exit 0 放行 |

### 2. `claude -p --setting-sources project,local --output-format stream-json`
- **(a) 在 messy.py 加函式**：測試 session 只呼叫 Read → Edit。Edit 只改了一行，但事後 Read 顯示**整個檔案**的行尾空白和 tab 空行都被清掉，`add(a, b)` 也排成 PEP 8 格式 → PostToolUse hook 生效 ✅。Claude 自己也注意到「檔案被 hook 格式化了」。
- **(b) 讀 .env**：Read 回傳 `is_error: true`，訊息為 `PreToolUse:Read hook error: ... 已阻擋：Read 不可存取機密檔 .env` → 被擋，Claude 沒拿到內容，也沒嘗試繞道 ✅。

測試 session 用 `--allowedTools` / `--disallowedTools` 限制工具（禁止 Bash、(b) 也禁止寫檔），避免它 commit 或亂寫檔。

## 和書上做法的差異／注意事項
1. **用 Python 寫 hook**：書上常見做法是 bash + `jq`；Windows 上 jq 不一定有、shell 跳脫麻煩，改用 Python 讀 stdin JSON 比較穩。
2. **格式化工具改成「有就用、沒有就退回」**：black 沒裝，所以 .py 用 `python -m ruff format`；prettier 加 `--no-install`，防止 hook 偷偷上網下載套件。format.py 永遠 exit 0，格式化失敗不影響 Claude 工作。
3. **block_env 採 fail-closed**：stdin JSON 壞掉時 exit 2（擋下），而不是放行，安全 hook 應該保守。
4. **已知漏洞**：只擋 Read/Write/Edit。Claude 仍可用 `Bash`（`cat .env`）、`Grep` 讀到內容。正式使用要把 matcher 擴大到 `Bash|Grep|Glob`，並解析 Bash 指令字串；或改用 `permissions.deny: ["Read(./.env*)"]` 搭配使用。
5. `.env.example` 這種範本檔也會被擋（照題目「.env.*」規則），正式專案可能要開白名單。
6. 用 `claude -p` 時若沒有 stdin，會等 3 秒並印警告，加 `< /dev/null` 可略過。
