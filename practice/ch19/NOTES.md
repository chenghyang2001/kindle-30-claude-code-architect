# NOTES — 第 19 章「三支柱整合」快速演練紀錄

> 快速 demo 模式：未經 QA／code-reviewer 流程，每個驗證只跑一次。日期：2026-10-18

## 做了什麼

| 項目 | 檔案 |
| --- | --- |
| Skill × 3 | `.claude/skills/commit-message/`、`code-review/`、`write-tests/`（各一個 `SKILL.md`） |
| Subagent × 2 | `.claude/agents/security-auditor.md`（只有 Read/Grep/Glob，haiku）、`test-runner.md`（Bash/Read，haiku） |
| Hook × 2 | `.claude/settings.json` → `hooks/guard.js`（PreToolUse：擋 `.env`、`rm -rf`）、`hooks/post-write.js`（PostToolUse：格式化＋`node --check`＋記 log）；共用 `hooks/log.js` 寫 `.claude/logs/hooks.log` |
| 專案素材 | `src/order.js`（刻意留 bug：`calcSubtotal` 迴圈從 `i = 1` 開始，漏算第一個品項）、`package.json`（`npm test` = `node --test`） |
| 文件 | `ARCHITECTURE.md`（決策表＋mermaid 協作圖） |

## 驗證結果

### 1. Hook 單元冒煙測試（直接把 JSON 餵給 hook）

| 輸入 | 預期 | 結果 |
| --- | --- | --- |
| Bash `rm -rf /tmp/x` | 擋（exit 2） | ✅ |
| Read `/a/.env` | 擋 | ✅ |
| Bash `cat .env` | 擋 | ✅ |
| Read `.env.example` | 放行 | ✅ |
| Bash `npm test` | 放行 | ✅ |
| Write 一個有行尾空白的 .js | 格式化並通過語法檢查 | ✅ `formatted=true syntax=ok` |
| Write 一個語法錯的 .js | exit 2 回饋錯誤 | ✅ |

### 2. 組合演練（一次 `claude -p`，stream-json）

指令：`env -u CLAUDE*... claude -p "<派 security-auditor 審 src/ → write-tests 寫測試並修 bug → commit-message 產生訊息>" --output-format stream-json --verbose --permission-mode acceptEdits`，並用 `--disallowedTools` 禁止 `git add/commit/push`。

stream-json 中觀察到的工具呼叫順序：

```
Agent   security-auditor          ← Subagent
  └ Glob / Read / Grep            （parent_tool_use_id 不為 null = 在 subagent 內部，且只用唯讀工具）
Skill   write-tests               ← Skill
Read src/order.js、package.json
Write test/order.test.js          → PostToolUse 格式化
Bash npm test                     （紅燈：4 通過 / 6 失敗）
Edit src/order.js（i = 1 → i = 0）→ PostToolUse 格式化
Bash npm test                     （綠燈：10/10）
Skill   commit-message            ← Skill
Bash git status / git diff
```

`hooks.log` 統計：PreToolUse 放行 14 次（含 subagent 內部的 Glob/Grep/Read）、PostToolUse 格式化 2 次（Write test、Edit src）→ **三支柱都有參與**。

- 費用約 US$0.99，16 turns。
- security-auditor 回報 6 項（3 中 3 低）：第 0 筆品項沒被驗證（就是 bug 本身）、`NaN`／`Infinity` 可通過 `< 0` 檢查、`discountRate` 為 NaN 時通過範圍檢查等。**本次只修了 bug，其餘輸入驗證問題沒處理。**
- 修正後我在主 session 再跑一次 `npm test`：10 pass / 0 fail。

### 3. 真實 session 中 guard 的阻擋

我自己的 Claude session 也即時載入了專案 hook。執行 `head -c 0 .env` 被擋下：
`[guard] 禁止在指令中存取 .env ...（由專案 PreToolUse hook 阻擋）`。
（用 Read 讀 `.env` 時，是全域 permission 設定先擋掉，沒輪到 hook。兩層防護都有效。）

## 和書上做法的差異／觀察

1. **格式化工具**：書上通常是 PostToolUse 呼叫 `prettier --write`。本機沒裝 prettier，也不想為了 demo 裝依賴，改成零依賴的最小格式化（去行尾空白、補結尾換行）＋ `node --check` 語法檢查。
2. **Hook 用 Node 而非 bash/jq**：Windows + Git Bash 環境下 jq、路徑轉換容易出問題，Node 跨平台較穩。注意 `/tmp/...` 這類 Git Bash 路徑 Node 看不到（冒煙測試時踩到一次，改用 Windows 路徑）。
3. **組合演練沒有觸發 hook 阻擋**：測試 session 這次沒有去碰 `.env` 或 `rm -rf`，所以阻擋只在單元測試和主 session 驗證，沒在組合演練裡出現。
4. **commit-message 階段 `git diff` 是空的**：repo 還沒有任何 commit、檔案全是未追蹤，所以 skill 改用 `git status` 推斷內容。書上的情境通常已有 baseline commit。下次可以先 commit 素材再演練，diff 會更有意義。
5. **`code-review` skill 與內建 `/code-review` 同名**：init 事件的 skills 清單中出現 `code-review`，專案版有被載入，但和 Claude Code 內建的 code-review 撞名，實務上建議改名（例如 `order-review`）避免混淆。本次演練沒有用到它。
6. **test-runner 沒被派到**：prompt 只要求 write-tests 自己跑 `npm test`，主 Claude 直接用 Bash 跑，沒有派 test-runner。它在 init 的 agents 清單中有出現（已正確載入）。
7. **模型自己加了 `Co-Authored-By`**：commit-message 產出的訊息帶了 Co-Authored-By 行，這是全域設定的影響，不是 skill 要求的。

## 已知未處理風險

- `src/order.js` 對 `NaN`／`Infinity`／非數字輸入的驗證不足（auditor 已指出）。
- guard 的 `.env` 偵測是 regex，像 `cat ./config/../.env` 或用變數組出檔名就擋不住；只是 demo 等級。
