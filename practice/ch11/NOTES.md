# NOTES：第 11 章「設計有效子代理」快速演練紀錄

> 快速 demo 模式：每個驗證只跑一次，未經 QA／審查。

## 做了什麼

1. 在專案層 `.claude/agents/` 建三個子代理：
   - `security-auditor`：tools `Read, Grep, Glob`，唯讀稽核，固定輸出嚴重度表格。
   - `test-runner`：tools `Read, Bash`，只跑測試、不改碼，model `haiku`。
   - `doc-writer`：tools `Read, Write`，只寫 `docs/`。
   - 每個 description 都有「何時派我／何時不要派我（改派誰）」。
2. `sample-app/server.js`：4 類刻意漏洞（硬編碼 DB 密碼與 JWT secret、SQL 字串拼接、`eval` 使用者輸入、反射型 XSS）。
3. 用 `claude -p` 派 security-auditor 實測一次。
4. 寫 `DESIGN.md`（能力越少越強＋權限比較表）。

## 驗證：security-auditor 實測

指令（測試 session 禁用寫入工具）：

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "請使用 security-auditor 子代理審查 sample-app/ 目錄的安全問題，並原樣回傳它的報告。" \
  --output-format stream-json --verbose \
  --disallowedTools "Write,Edit,Bash,NotebookEdit" --permission-mode bypassPermissions
```

| 檢查項 | 結果 |
|--------|------|
| 三個 agent 被載入 | ✅ init 事件的 `agents` 含 doc-writer / security-auditor / test-runner |
| 主 session 有委派 | ✅ `Agent(subagent_type="security-auditor")` |
| 子代理工具呼叫 | `Glob` ×1、`Read` ×2（server.js、package.json）——全在白名單內，零寫入 |
| 檔案前後 SHA256 比對 | ✅ 專案檔案無變動（唯一新增 `.claude/session-state.md`，是全域 Stop hook `save-session-state.sh` 寫的，非子代理；已加 .gitignore） |
| 抓到 4 類預埋漏洞 | ✅ eval RCE、SQL 注入（Critical）、兩個硬編碼機密、XSS（High） |
| 行號正確 | ✅ 抽查 9/10/14/22/31/37/40 全對 |
| 額外發現 | root 連線、機密寫進 log、無認證、錯誤訊息洩漏、缺 helmet/rate limit、mysql 套件過時等 |
| 輸出格式 | ⚠️ 大致符合：有標題、範圍、嚴重度表格、總結行（Critical 2 / High 6 / Medium 3 / Low 2）。但欄名略改（「位置」「說明與攻擊情境」），且表格後多了「未發現項目」「優先修復順序」段落 |
| 耗時／成本 | 約 49 秒，0.90 USD（含主 session） |

結論：唯讀保證成立（工具層硬邊界）；格式「精神符合、字面略有偏差」。依快速模式規則不再迭代。
若要字面完全一致，可在系統提示加「欄名不可更改、表格後只允許總結一行」並附完整範例。

## 未驗證

- test-runner、doc-writer 未實測（題目只要求驗證 security-auditor）。
- doc-writer 的「只寫 docs/」與 test-runner 的「只跑測試」只靠提示詞約束，未用 deny 規則或 hook 硬化。

## 和書上做法的差異

- 書上範例以概念說明為主；本演練額外加了「改派誰」的反向路由與 `model` 分級（haiku／sonnet）。
- 驗證時在**主 session** 層面也用 `--disallowedTools` 禁寫，雙層保險，並用 SHA256 前後比對證明零寫入，而不只看輸出。
- 範例專案未安裝 npm 依賴（稽核只需靜態讀碼）。
