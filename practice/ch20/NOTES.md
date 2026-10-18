# 第 20 章全棧案例演練筆記（快速模式）

> 快速 demo 模式：主 Claude 直接寫檔，未經獨立 QA／code review。只在本機 commit，沒有 push 或部署。

## 做了什麼

1. **Todo API**（零依賴）：用 `node:http` 加 TypeScript 寫成，Node 24 直接執行 `.ts`（靠內建的型別剝除，不用 tsc 或 tsx）。
   - `GET /todos`、`POST /todos`、`GET /todos/:id`、`DELETE /todos/:id`，以及第 4 步由 `claude -p` 新增的 `PATCH /todos/:id`
   - 驗證：title 會去掉前後空白、不可為空、最多 200 字；id 必須是正整數
   - 錯誤碼：400 輸入錯誤、404 找不到、405 方法不支援、413 body 超過 10KB、500 內部錯誤（不回傳細節）
2. **測試**：用 `node:test` 寫，每個測試在隨機埠（port 0）開一個獨立 server
3. **專案層 Claude Code 設定**（全部放在 `./.claude/`，全域 `~/.claude/` 一個檔案都沒動）
   - `CLAUDE.md`：專案說明、目錄結構、指令、慣例
   - skills：`api-endpoint`（新增端點 6 步驟）、`write-tests`（happy / edge / error 三類）
   - agents：`code-reviewer`（sonnet，只讀）、`test-runner`（haiku，跑測試並摘要）
   - hooks（`settings.local.json`）：
     - PreToolUse `block-env.mjs`：擋下 Read／Edit／Write／Bash／Grep／Glob 對 `.env*` 的操作（`.env.example` 放行）
     - PostToolUse `post-edit-test.mjs`：Edit／Write 改到 `.ts`／`.js` 後跑 `npm test`，失敗時 exit 2，把測試輸出回饋給 Claude

## 結構

```
src/   store.ts  validate.ts  app.ts  server.ts
test/  helpers.ts  todos.test.ts  patch-todo.test.ts（claude -p 產生）
.claude/
  settings.local.json
  hooks/   block-env.mjs  post-edit-test.mjs
  skills/  api-endpoint/SKILL.md  write-tests/SKILL.md
  agents/  code-reviewer.md  test-runner.md
CLAUDE.md  NOTES.md  package.json  tsconfig.json
```

## 驗證結果

| 項目 | 結果 |
| --- | --- |
| 基線 `npm test` | 16/16 通過（3 個 suite：happy / edge / error） |
| hook 單元測試（直接餵 JSON） | 8/8 通過：`.env`、`.env.local`、`cat .env` 回 exit 2；`.env.example`、一般檔案回 exit 0；post-edit 碰 `.ts` 會跑測試，碰 `.md` 略過 |
| PreToolUse hook 實際生效 | 有生效：hook 剛寫好，本 session 下一條含 `cat .env` 的 Bash 指令就被擋了 |
| `claude -p` 新增 PATCH | 成功：19 turns、約 118 秒、約 US$1.10 |
| 最終 `npm test` | **41/41 通過，0 失敗**（新增 25 個 PATCH 測試） |

`claude -p` 的 stream-json 紀錄：

- init 事件有列出 `api-endpoint`、`write-tests` 兩個 skill，以及 `code-reviewer`、`test-runner` 兩個 agent，表示專案層設定都有載入
- 工具順序：`Skill(api-endpoint)` → Read 3 個 src 檔與 write-tests SKILL.md → Edit `store.ts`／`validate.ts`／`app.ts` → Write `test/patch-todo.test.ts` → `npm test`
- 照 skill 的規則：未知欄位回 400、空物件回 400、`done` 不是布林值回 400、先驗 id 再讀 body
- 沒有 commit：遵守 prompt 的禁令（就算全域 Stop hook 提醒要 commit 也沒有）
- 一次 Bash 被權限擋下：指令是 `cd ... && cat ...` 組合，不在 allowedTools 內；它改成單獨跑 `npm test` 就過了

## 和書上做法的差異

| 書上（典型做法） | 本次演練 | 原因 |
| --- | --- | --- |
| Express + ts-node／tsx + Jest／Vitest | `node:http` + Node 原生跑 `.ts` + `node:test` | 偏好零依賴，不用 `npm install` |
| hook 用 bash／jq 腳本 | hook 用 Node `.mjs` | Windows + Git Bash 環境沒有 jq，Node 一定有 |
| hooks 寫在 `.claude/settings.json`（團隊共用） | 寫在 `.claude/settings.local.json` | 本專案 CLAUDE.md 規定。這個檔被全域 git ignore（`~/.config/git/ignore`）排除，所以用 `git add -f` 強制納入版控 |
| PostToolUse 跑格式化工具（prettier） | 跑 `npm test` 當快速檢查 | 零依賴，沒有 prettier |
| TypeScript 可用 enum 等語法 | 只用 erasable 語法 | Node 型別剝除不支援 enum／namespace／參數屬性，已寫進 CLAUDE.md 與 skill |

## 已知限制與風險（未處理）

- **PostToolUse hook 在 `claude -p` 中無法直接觀察**：stream-json 只輸出 SessionStart 的 hook 事件。hook 成功（exit 0）時的 stdout 不會回給模型，所以無法從紀錄證明子 session 有觸發它。腳本本身的直接測試是通過的。
- 子 session 也會載入全域 hooks（例如會自動格式化的 PostToolUse、SessionStart 提醒、Stop 提醒 commit），所以它的行為不是「只有本專案設定」的乾淨環境。執行時加了 `FORCE_DIRECT_WRITE=1`，避免全域的寫檔 hook 擋住它。
- `block-env` 對 Bash 只做字串比對，`cat .e""nv` 這類混淆寫法擋不住；靠 `permissions.deny` 補一層。
- 資料只存在記憶體，沒有持久化；沒有認證、沒有 rate limit（教學 demo 範圍外）。
- 全域 hook 產生的 `.claude/session-state.md` 已加進 `.gitignore`，不納入版控。
