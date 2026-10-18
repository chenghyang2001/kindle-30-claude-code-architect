# 第 02 章演練筆記

## 做了什麼

1. 在 `CLAUDE.md` 上方補專案說明，保留原本的「本專案例外」段落。
2. 建立專案層 `.claude/`：空的 `skills/`、`agents/`（各放 `.gitkeep`），`settings.json` 內容為 `{}`。
3. 執行解構診斷：`ls -la .claude`、`ls ~/.claude`，統計全域各目錄數量；`settings.json` 只列頂層 key，沒有印出任何值或機密。
4. 寫 `ANATOMY.md`：兩層目錄結構、設定優先順序、skills／agents 同名規則、診斷輸出摘要。

## 驗證結果

- 用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "..."` 開新 session 詢問，回答：「有載入『本專案例外』段落；`.claude/settings.json` 內容是 `{}`」→ 專案層 CLAUDE.md 與設定檔都被正確讀到。
- 新 session 結束時出現一個 plugin 的 SessionEnd hook「Hook cancelled」訊息，來自全域 plugin，與本演練無關。

## 和書上做法的差異

- 書上用空目錄示範；git 不追蹤空目錄，所以多放 `.gitkeep`。
- 全域層只讀：沒有開啟 `settings.json`／`.credentials.json`／`~/.claude.json` 的內容，只列檔名與頂層 key。
- 本機沒有 managed 層，無法實測「managed 蓋掉一切」，只在文件中說明。
- skills／agents 同名優先順序依官方文件整理（skills 個人蓋專案、agents 專案蓋個人），本次未建同名 skill 實測，因為題目要求 skills／agents 保持空目錄。
- 全程未修改 `~/.claude/` 任何檔案；未建 repo、未 push。
