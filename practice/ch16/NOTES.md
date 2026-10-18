# 第 16 章 Hook 設計模式 — 演練筆記

環境：Windows 10、Git Bash、Node v24.13.1、Claude Code 2.1.302；本視窗以 `--setting-sources project,local` 啟動。

## 做了什麼

- `.claude/settings.json`：註冊 4 個 hook（PreToolUse/Bash、PostToolUse/Write|Edit ×2（同步＋async）、Stop）。
- `.claude/hooks/`：`lib.js`（共用：讀 stdin、MSYS 路徑轉換、時間戳、寫 log）、`guard.js`、`pipeline.js`、`async-bg.js`、`gate.js`。
- `calc.js` / `calc.test.js`：Gate 的示範標的（原本故意寫成 `a - b`，由測試 session 修成 `a + b`）。
- `PATTERNS.md`：四種模式說明與實測對照表。
- `.gitignore`：忽略 `.claude/hooks/*.log`。
- 全程沒有動到全域 `~/.claude/`。

## 驗證結果

1. **單元測試（直接餵 JSON）**：四支腳本全過。第一次跑時 Pipeline / Gate 失敗，原因是我餵的是 Git Bash 式路徑 `/c/Users/...`，Node 會解析成 `C:\c\Users`；於是在 `lib.js` 加 `toNative()` 轉換，修正後重測通過（另外 template literal 吃掉 regex 反斜線，改一次）。
2. **`claude -p` 整合測試**（`env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ... --setting-sources project,local --output-format stream-json --verbose`，並 `--disallowedTools "Bash(git *)"` 禁止 commit）：
   - Guard：`rm -rf ./guard_target` 被擋，目錄仍在。✅
   - Pipeline：兩個檔案寫入後被格式化、log 2 行。✅
   - Async：第一輪（連寫兩檔）時間差被模型思考時間干擾，無法下結論；修正一輪改為「寫檔＋Bash 印時間戳」，仍被模型延遲（約 11 秒）蓋過。最後改看 stream-json 事件本身的 `timestamp`：Write 的 tool_result 在 16.814 回傳，async hook 到 19.779 才結束 → **確認不阻塞**。
   - Gate：block 一次 → Claude 修好 bug → 第二次 Stop 放行。✅ 測試 session 想自行重跑 `node --test` 時因 `--allowedTools` 沒給 Bash 而被權限擋下，這不影響 Gate 結論。
3. **意外但有用的觀察**
   - 設定是**熱載入**的：建立 `settings.json` 後，本 session 立刻套用。我的單元測試指令字串內含 `rm -rf` 就被 Guard 擋下，只好把測試寫成腳本檔再執行。
   - Gate block 時，CLI 的 stream-json 會發出 `stop-hook-error` 通知（UI 文字是「Stop hook error occurred」），雖然這是正常的 block 行為，名稱容易誤會。
   - PostToolUse 改檔後，Claude 會收到「檔案被 hook 改過」的提示，所以它在回覆中主動說明檔案可能被格式化。

## 和書上做法的差異

> 本 session 手邊沒有書本原文，以下以任務描述的章節模式及官方 hooks 文件的常見寫法為比較基準。

- **語言**：常見範例用 bash＋jq；這裡全部用 Node，在 Windows / Git Bash 下不需處理 jq 與路徑跳脫，也能直接 `node --test`。
- **格式化器**：本機沒有 prettier，改用內建簡易格式化，概念相同（寫檔後自動整理）。
- **Gate 放行策略**：`stop_hook_active=true` 時直接放行，不重跑測試，所以「最多擋一輪」。更嚴格的作法是再跑一次測試、只在仍失敗時才放行並警告；本演練刻意選最保守的防迴圈寫法。
- **Gate 出錯時 fail-open**：掃描失敗就放行，避免 Stop hook 卡死。
- **Guard 用 regex**：只是示範，無法擋住 `find -delete`、`bash -c "$(echo cm0gLXJm | base64 -d)"` 之類繞法；正式環境應搭配 `permissions.deny` 與沙箱。
- **Windows 路徑**：額外處理 `/c/...` → `C:/...`，這是書上（多半以 macOS / Linux 為主）不會碰到的問題。
