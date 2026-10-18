# DESIGN：設計有效子代理（第 11 章演練）

## 核心原則：能力越少越強

| 原則 | 做法 | 為什麼更強 |
|------|------|-----------|
| 工具最少化 | 只給完成職責「必需」的工具（security-auditor 不給 Write/Bash） | 從**機制**上保證安全，而不是靠提示詞「拜託別改檔」。模型就算誤判也做不到越權。工具清單越短，模型選工具的分支越少，行為越可預測。 |
| 職責單一 | 每個 agent 只做一件事：稽核／跑測試／寫文件 | context 乾淨、判斷聚焦；不會「順手修一下」而把稽核變成未審查的改碼。輸出也容易被主 agent 或下一個 agent 消費。 |
| description 精準 | 明寫「何時派我」＋「何時不要派我」，並指向替代 agent | 主 agent 靠 description 決定委派。只寫正向觸發會被過度派遣；加上反向條件與「改派誰」，路由才準。 |
| 固定輸出格式 | 每個系統提示都規定表格／區塊格式 | 子代理的回覆是給機器（主 agent）讀的，格式穩定才能被彙整、比較、自動化。 |
| 模型分級 | 判斷型用 sonnet，機械型（跑測試）用 haiku | 成本與能力匹配；跑測試不需要強推理。 |

## 三個 agent 的工具權限比較

| 工具 | security-auditor | test-runner | doc-writer |
|------|:---:|:---:|:---:|
| Read | ✅ | ✅ | ✅ |
| Grep | ✅ | — | — |
| Glob | ✅ | — | — |
| Bash | — | ✅（只跑測試指令） | — |
| Write | — | — | ✅（只限 `docs/`） |
| Edit | — | — | — |
| 模型 | sonnet | haiku | sonnet |
| 能否改程式碼 | ❌ 機制上不可能 | ⚠️ 機制上可能，靠提示詞約束 | ⚠️ 可寫任意路徑，靠提示詞約束只寫 `docs/` |

## 權限邊界的強弱

- **硬邊界（工具層）**：security-auditor 沒有任何寫入工具 → 最強保證。
- **軟邊界（提示詞層）**：test-runner 的 Bash 可以 `echo > file`；doc-writer 的 Write 不限路徑。
  `tools:` 欄位無法細到「只能寫某目錄」或「只能跑某指令」。
- **補強方式（未實作，留作延伸）**：用專案 `.claude/settings.json` 的 `permissions.deny`
  （如 `Bash(git commit:*)`、`Write(src/**)`）或 PreToolUse hook 檢查路徑，把軟邊界升級成硬邊界。

## 檔案位置

- `.claude/agents/security-auditor.md`
- `.claude/agents/test-runner.md`
- `.claude/agents/doc-writer.md`
- `sample-app/server.js`：刻意含漏洞的範例（eval、SQL 拼接、硬編碼 secret、XSS）
