# 第 10 章演練：子代理基礎（快速模式）

> 快速 demo 模式：未經 QA／審查流程，只跑一次冒煙驗證。

## 做了什麼

| 檔案 | 用途 |
|------|------|
| `.claude/agents/code-reviewer.md` | 專案層子代理。frontmatter：`name`、`description`（何時派它）、`tools: Read, Grep, Glob`、`model: sonnet`；系統提示寫審查重點（正確性／安全／可讀性）＋固定輸出格式（嚴重度四級表 🔴嚴重／🟠高／🟡中／🟢低 + APPROVED/CHANGES_REQUESTED 結論） |
| `app.py` | 故意寫壞的小程式：硬編碼 API key、`average([])` 除以零、可變預設參數 `bucket=[]`、裸 `except:` |

## 驗證方式

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "@code-reviewer review app.py" \
  --output-format stream-json --verbose \
  --disallowedTools "Write Edit NotebookEdit Bash"   # 禁止測試 session 寫檔／commit
```

執行前後對 `app.py` 與 agent 定義檔做 `sha256sum` 比對。

## 實測結果（2026-10-18，Claude Code 2.1.302）

| 檢查項 | 結果 |
|--------|------|
| 有派出子代理 | ✅ 主 session 呼叫 `Agent`，`subagent_type: "code-reviewer"` |
| 子代理只用白名單工具 | ✅ 子代理（`parent_tool_use_id` = 該 Agent 呼叫）只用了 `Read`，接著 `SubagentHandback` 回傳結果 |
| model 選擇生效 | ✅ `result.modelUsage` 同時出現 `claude-opus-5-5`（主）與 `claude-sonnet-5-5`（子代理） |
| 沒改任何檔案 | ✅ `sha256sum -c` 兩檔皆 OK；`git status` 無變化 |
| 抓到 4 個預埋問題 | ✅ 硬編碼 key、除以零、可變預設參數、裸 except 全部列為最高級，另外多抓到 URL 參數注入、缺 timeout、沒 `raise_for_status()` 等，共 12 項 |
| 輸出照固定格式 | ⚠️ 部分符合：有「審查摘要／問題清單表格／結論」結構，但分級用的是 🔴必改／🟡建議改／🟢備註，不是 agent 定義的四級 |
| 花費 | 2 turns，約 US$0.86 |

### ⚠️ 格式不符的原因

從 stream-json 看主 session 交給子代理的 prompt，主 session 自己加了「依嚴重度分級（🔴 必改 / 🟡 建議改 / 🟢 備註）」——這是使用者全域 CLAUDE.md 的慣用分級。
**派工 prompt 的指示會蓋過子代理系統提示裡的格式**。依快速模式規則不再修改重測，改善方向：

- 在 agent 系統提示加一句「若派工 prompt 指定其他格式，仍以本格式為準」；或
- 在 `description` 寫明「派工時不需指定輸出格式」。

## 子代理 vs. Skill

| 面向 | 子代理（`.claude/agents/*.md`） | Skill（`.claude/skills/*/SKILL.md`） |
|------|------|------|
| Context | **獨立 context**：只看到派工 prompt + 自己的系統提示，讀檔、搜尋的中間過程不會塞進主對話，最後只回一份摘要 | **共用主 context**：SKILL.md 內容載入到主對話，所有中間過程都佔主 context |
| 工具權限 | `tools:` **白名單**，可做成真正唯讀（本例沒有 Write/Edit/Bash，就算想改也改不了） | 用的是主 session 的工具與權限（`allowed-tools` 只是預先核准，不是限制） |
| 模型 | `model:` 可另選（本例 sonnet，主 session 是 opus），省錢或換能力 | 跟著主 session 的模型 |
| 觸發 | 主 Claude 依 `description` 判斷派工，或 `@agent-name` 明確指名 | 依 `description` 自動載入，或 `/skill-name` |
| 適合 | 唯讀審查、大範圍搜尋、可平行的獨立子任務 | 可重複使用的流程／知識，需要和主對話連續互動 |
| 代價 | 每次派工都要重新讀檔（沒有主 context），而且是另一個模型呼叫 | 佔主 context |

## 和書上做法的差異

- 書上用 `/agents` 互動式精靈建立；這裡直接手寫 `.claude/agents/code-reviewer.md`（效果相同，方便 commit）。
- 書上通常在互動 session 內觀察子代理；這裡用 `claude -p ... --output-format stream-json` 從 JSON 判斷，看得到 `Agent` 呼叫、`parent_tool_use_id` 以及 `modelUsage` 的模型分佈，證據比較明確。
- 這個版本的 Claude Code 工具名是 `Agent`（舊版／書上叫 `Task`），子代理結束時多了 `SubagentHandback` 這個回傳步驟。
- 本機另有使用者層的同名 `code-reviewer`（全部工具）；專案層定義優先，實測派到的是專案層版本（只用了 Read，也照專案層的系統提示寫出結論段）。
- 額外用 `--disallowedTools` 鎖住主 session，避免驗證過程寫檔。
