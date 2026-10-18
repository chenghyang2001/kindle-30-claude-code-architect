# NOTES：第 21 章「一人創業者」快速演練紀錄（2026-10-18）

> 快速 demo 模式：沒有經過 QA 或 reviewer 審查，每項驗證只跑一次。

## 做了什麼

1. **技能庫**：`.claude/skills/` 下建了 5 個 skill，分別是 landing-copy、customer-reply、weekly-report、invoice-check、launch-checklist。每個 description 都寫明觸發和不觸發的情境。
2. **Hooks 管線**：`.claude/settings.json` 加上 3 個 Node.js hook。
   - SessionStart：列出 TODO.md 未完成的待辦
   - PostToolUse（Write|Edit）：寫檔紀錄追加到 `logs/tool-writes.log`
   - Stop：有未 commit 的變更就提醒，不阻擋
3. **TODO.md**：示範用的待辦清單。
4. **SOLO-SETUP.md**：說明架構、各 skill 的用途，以及搬到全域的步驟、風險、備份和回滾方式（只寫文件，沒有實際搬）。
5. **verify/**：兩次 `claude -p` 驗證的 stream-json 原始輸出。

## 驗證結果

| 項目 | 方法 | 結果 |
| --- | --- | --- |
| 3 個 hook 冒煙測試 | 直接用 node 執行，餵模擬的 stdin | ✅ 第一次失敗：Git Bash 傳的 `/c/Users/...` 路徑 Node 讀不到。腳本加上路徑轉換後通過 |
| customer-reply | `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ... --output-format stream-json`，禁止 Write/Edit/git commit/push | ✅ init 時 5 個 skill 都有載入；呼叫了 `Skill(customer-reply)`；輸出含「意圖：退款｜情緒：不滿」，回覆結構符合 SKILL.md |
| weekly-report | 同上，另外提供營收、訂單、客服件數 | ✅ 呼叫了 `Skill(weekly-report)`，再用 Bash 讀 git log 和 TODO.md；週報 4 個段落齊全，缺少的上週數字填「—」，沒有捏造 |
| SessionStart hook（真實 session） | 檢查 stream-json 的 hook_response | ✅ 兩次測試都印出「📋 今日待辦…共 4 項」 |
| Stop hook（真實 session） | grep stream-json | ✅ 兩次測試都出現「未 commit 的變更（只提醒，不阻擋）」 |
| PostToolUse hook | 只做冒煙測試 | ⚠️ 測試 session 依規定禁止寫檔，所以沒有在真實 session 觸發過；用模擬 stdin 測試時能正確寫 log |

## 和書上做法的差異

| 書上 | 本演練 | 原因 |
| --- | --- | --- |
| skill 和 hook 放全域 `~/.claude/` | 全部放專案層 `./.claude/` | 演練規定不碰全域；搬遷方式寫在 SOLO-SETUP.md 第 4 節 |
| 技能庫較完整 | 精簡版 5 個 skill，每個只有一份 SKILL.md，沒有 scripts/references | 快速模式只做最小可用版本 |
| hook 多半用 shell 腳本 | 用 Node.js | Windows + Git Bash 環境下比較好處理路徑和 JSON |
| 數字、政策都是真實資料 | 「7 天內無條件退款」、品牌名稱都是假設值 | 示範用，實際使用時要換掉 |

## 已知風險與沒處理的事

- 測試 session 也會跑使用者的**全域** hooks（例如 `.claudeignore` 提示、`session-state.md`）。`.claude/session-state.md` 是全域 hook 產生的，已加進 `.gitignore`，不是測試 session 寫的檔案。
- 有一個全域 plugin hook 報錯 `${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd: No such file or directory`，跟本專案無關，沒有處理。
- invoice-check、landing-copy、launch-checklist 沒有用 claude -p 實測（規定只驗證 2 個）。
- 沒有 push，也沒有建 GitHub repo。
