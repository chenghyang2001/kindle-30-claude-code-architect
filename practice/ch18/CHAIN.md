# 第 18 章 Hook 鏈 演練結果

測試指令：`claude -p "建立 hello.py ..." --setting-sources project,local --output-format stream-json --allowedTools Write --disallowedTools Bash`
（Claude Code 2.1.302，Windows 10 / Git Bash，設定放在 `.claude/settings.local.json`）

## 1. 跨事件管線（pipeline.log）

```
11:19:14.079 079f170a-4e65-4a09-ae29-18168a57fb9d SessionStart session-start
11:19:16.681 079f170a-4e65-4a09-ae29-18168a57fb9d UserPromptSubmit prompt-submit
11:19:19.635 079f170a-4e65-4a09-ae29-18168a57fb9d PreToolUse pre-tool Write
11:19:20.015 079f170a-4e65-4a09-ae29-18168a57fb9d PostToolUse post-tool Write
11:19:23.728 079f170a-4e65-4a09-ae29-18168a57fb9d Stop stop
```

**結論：順序符合預期** SessionStart → UserPromptSubmit → PreToolUse → PostToolUse → Stop，
5 個事件共用同一個 session_id。工具呼叫只有 1 次 Write（stream-json 已確認），所以 Pre/Post 各一筆。

## 2. 同事件 3 個 hook（chain.log）

設定順序為 lint → format → log，每個 hook 刻意 `sleep 1` 秒。格式：`開始時間 結束時間 事件 hook名`

```
11:19:20.020 11:19:21.021 PostToolUse log
11:19:20.022 11:19:21.022 PostToolUse format
11:19:20.025 11:19:21.026 PostToolUse lint
```

**結論：平行執行，不是依序。**

- 3 個 hook 的開始時間只差 5 毫秒，全部在約 1 秒後一起結束。若是依序執行，總時間應該約 3 秒，開始時間會各差 1 秒。
- 實際開始順序（log → format → lint）甚至和設定順序相反，代表**設定裡的先後順序不保證執行順序**。
- 與官方文件一致：hooks 文件說明同一事件「所有符合的 hook 平行執行（run in parallel）」，且相同指令會自動去重。

## 3. 如果真的需要 lint → format → log 依序

平行模型下不能靠陣列順序。可行做法：

1. 合併成單一 hook：`command: "lint.sh && format.sh && log.sh"`，或用一個 wrapper 腳本依序呼叫。
2. 讓每個 hook 都能獨立執行、彼此不相依（例如 log 不要讀 format 的輸出）。
3. 寫同一個檔案時要注意競爭：本次 3 個 hook 都用 append 模式寫 chain.log，每行很短，沒有出現交錯，但大量輸出時不保證。
