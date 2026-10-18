# NOTES：第 18 章 Hook 鏈 快速演練

## 做了什麼

- `.claude/hooks/log_hook.py`：通用記錄腳本，從 stdin 讀 hook JSON，依參數寫 `chain.log` 或 `pipeline.log`（毫秒時間戳），可加延遲秒數。
- `.claude/settings.local.json`：
  - SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop 各掛一個 pipeline 記錄 hook。
  - PostToolUse（matcher `Write|Edit`）掛 3 個 hook：lint → format → log，每個 sleep 1 秒。
- 以 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ... --setting-sources project,local --output-format stream-json`
  跑一次「建立 hello.py」，只允許 Write、禁止 Bash（不能 commit）。產出 `hello.py`（`print("hello")`）。
- 結果與 log 摘錄寫在 `CHAIN.md`。

## 驗證結果（各跑一次，一次成功）

| 項目 | 結果 |
| --- | --- |
| 跨事件順序 | ✅ SessionStart → UserPromptSubmit → PreToolUse → PostToolUse → Stop，session_id 一致 |
| 同事件 3 個 hook | ⚡ 平行：開始時間差 5ms、同時結束，總耗時約 1 秒（依序應約 3 秒）；實際啟動順序與設定順序相反 |
| 與官方文件 | 一致：同事件的符合 hook 會平行執行 |

## 和書上做法的差異

- 「Hook 鏈」若理解成依陣列順序 lint → format → log 一個接一個，實測並非如此；同事件的多個 hook 是平行的，要依序就得合併成單一指令（`&&`）或 wrapper 腳本。
- 書上範例多半用 bash 腳本；本演練在 Windows 上改用 Python 腳本（跨平台、方便取毫秒時間戳）。
- 刻意加 1 秒延遲才能從時間戳明確分辨平行與依序；沒加延遲時三行幾乎同時，難以判斷。
- 設定寫在 `settings.local.json`（專案規定），不是 `settings.json`；且以 `--setting-sources project,local` 排除全域設定的干擾。
- PostToolUse 另掛了一個 matcher `*` 的 pipeline hook，它和 chain 的 3 個 hook 也會一起平行觸發（pipeline 那筆 20.015、chain 從 20.020 開始）。
