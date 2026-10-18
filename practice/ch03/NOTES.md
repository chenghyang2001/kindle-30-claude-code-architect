# 第 03 章「三大支柱」快速演練筆記

> 快速 demo 模式：沒有走 QA／reviewer 流程，只做了冒煙測試和 `claude -p` 實測。

## 做了什麼

| 支柱 | 檔案 | 重點 |
|------|------|------|
| Skill | `.claude/skills/pr-review/SKILL.md` | frontmatter 有 `name`、`description`；內容是 5 類 PR 審查清單，加上固定的輸出表格 |
| Subagent | `.claude/agents/security-auditor.md` | `tools: Read, Grep, Glob`（唯讀），專找硬編碼機密和 SQL 注入 |
| Hook | `.claude/settings.json` + `.claude/hooks/protect_auth.py` | PreToolUse，`matcher: Write\|Edit`。從 stdin 讀 JSON，`file_path` 在 `auth/` 底下時，印錯誤到 stderr 並 `exit 2` |
| 示範檔 | `app.py`、`auth/login.py` | `app.py` 故意放了硬編碼密碼 `DB_PASSWORD` 和 f-string SQL 注入 |

## 驗證結果（`env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ...`）

### (a) 用 pr-review 技能審查 app.py：✅
- 輸出完全照 SKILL.md 定義的格式（`## PR 審查結果` 表格加上 `APPROVE / REQUEST CHANGES` 結論），表示技能有被載入。
- 結論是 **REQUEST CHANGES**，有 3 項必改：L4 硬編碼密碼、L9 SQL 注入，以及 L9 遇到單引號名字會出錯。它還實際跑了 `x' OR '1'='1`，確認能撈出全部資料。

### (b) 派 security-auditor 審查 app.py：✅
- 回報有呼叫 `subagent_type: security-auditor`（agentId `a2c0673b518ee33da`），用了 3 次工具，沒有改任何檔案。
- 找到 4 個問題：`app.py:4` 硬編碼密碼（高）、`app.py:9` SQL 注入（高），另外順便掃到 `auth/login.py` 的 `==` 時序攻擊和明文密碼（都是低）。

### (c) 叫它修改 auth/login.py：✅ 被擋下
- Edit 被 hook 阻擋，錯誤訊息是 `🚫 已阻擋：auth/ 目錄受保護，禁止修改 ...\auth\login.py`。
- 修改前後的 SHA256 一樣（`a2f2c45d...df46d48`），檔案沒有變動。

### Hook 單元冒煙測試
| 輸入 | exit code |
|------|-----------|
| 絕對路徑 `.../auth/login.py` | 2（擋下） |
| 反斜線相對路徑 `auth\login.py` | 2（擋下） |
| `app.py` | 0（放行） |
| 非 JSON | 0（放行，並印警告） |

## 和書上做法的差異

1. **路徑判斷比較嚴謹**：書上通常只寫 `"auth/" in file_path`。這裡會先把反斜線轉成正斜線、把絕對路徑轉成相對專案根目錄，再比對第一層目錄名稱（不分大小寫）。這樣 Windows 路徑也擋得住，`myauth/` 或 `src/auth_utils.py` 這類路徑也不會被誤擋。
2. **hook 用 `$CLAUDE_PROJECT_DIR` 組腳本路徑**：從子目錄啟動 Claude 時才找得到腳本。
3. **JSON 解析失敗會放行（exit 0）**：避免 hook 本身壞掉時，所有寫檔都被卡住。這是可用性和安全性之間的取捨；如果要更安全，可以改成解析失敗就擋（fail-closed）。
4. **驗證用 `--permission-mode bypassPermissions`**：讓 `claude -p` 不會卡在權限詢問。hook 在這個模式下照樣生效，(c) 就是證據。
5. **(c) 的 prompt 限定只能用 Edit/Write**：這個 hook 只攔 Write/Edit，攔不到 Bash（例如 `sed -i`）。要完整保護，需要在 matcher 加上 `Bash`，並解析指令內容。
6. **設定寫在 `.claude/settings.json`**：照題目要求放在專案層的共享設定。專案 CLAUDE.md 偏好 `settings.local.json`，但兩者都在專案層，都沒有動到全域 `~/.claude/`。
